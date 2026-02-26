import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaskStatus } from './schemas/task.schema';

interface CurrentUserData {
  userId: string;
  email: string;
  role: string;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.create(createTaskDto, user.userId);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.tasksService.findAll(
      { status: status as TaskStatus, priority, sortBy, order },
      user.userId,
      user.role,
    );
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.findById(id, user.userId, user.role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.userId, user.role);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tasksService.delete(id, user.userId, user.role);
  }
}
