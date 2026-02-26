import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { UserRole } from '../users/schemas/user.schema';

interface TaskFilters {
  status?: TaskStatus;
  priority?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = await this.taskModel.create({
      ...createTaskDto,
      createdBy: userId,
      assignedTo: createTaskDto.assignedTo || null,
    });

    return task.populate('createdBy assignedTo', 'name email');
  }

  async findAll(
    filters: TaskFilters = {},
    userId: string,
    role: string,
  ): Promise<Task[]> {
    let query: any = {};

    // If member, only show own tasks (created or assigned)
    if (role !== UserRole.ADMIN) {
      query = {
        $or: [
          { createdBy: userId },
          { assignedTo: userId },
        ],
      };
    }

    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply priority filter
    if (filters.priority) {
      query.priority = filters.priority;
    }

    // Build sort options
    const sortBy = filters.sortBy || 'createdAt';
    const order: SortOrder = filters.order === 'asc' ? 1 : -1;
    const sort: { [key: string]: SortOrder } = { [sortBy]: order };

    const tasks = await this.taskModel
      .find(query)
      .sort(sort)
      .populate('createdBy assignedTo', 'name email')
      .exec();

    return tasks;
  }

  async findById(taskId: string, userId: string, role: string): Promise<Task> {
    const task = await this.taskModel
      .findById(taskId)
      .populate('createdBy assignedTo', 'name email');

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check authorization
    this.checkTaskAccess(task, userId, role);

    return task;
  }

  async update(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    role: string,
  ): Promise<Task> {
    const task = await this.taskModel.findById(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check authorization
    this.checkTaskAccess(task, userId, role, 'update');

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(taskId, updateTaskDto, { new: true })
      .populate('createdBy assignedTo', 'name email');

    return updatedTask;
  }

  async delete(
    taskId: string,
    userId: string,
    role: string,
  ): Promise<{ message: string }> {
    const task = await this.taskModel.findById(taskId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check authorization
    this.checkTaskAccess(task, userId, role, 'delete');

    await this.taskModel.findByIdAndDelete(taskId);

    return { message: 'Task deleted successfully' };
  }

  private checkTaskAccess(
    task: Task,
    userId: string,
    role: string,
    action: 'read' | 'update' | 'delete' = 'read',
  ): void {
    // Admin can do anything
    if (role === UserRole.ADMIN) {
      return;
    }

    // Member can only access their own tasks
    const createdById = task.createdBy.toString();
    const assignedToId = task.assignedTo ? task.assignedTo.toString() : null;

    const isCreator = createdById === userId;
    const isAssignee = assignedToId === userId;

    if (!isCreator && !isAssignee) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // Members can only update/delete if they created it
    if ((action === 'update' || action === 'delete') && !isCreator) {
      throw new ForbiddenException(
        `You cannot ${action} this task (only the creator can)`,
      );
    }
  }
}
