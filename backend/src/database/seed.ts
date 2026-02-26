import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema, UserRole } from '../users/schemas/user.schema';
import { Task, TaskSchema, TaskStatus, TaskPriority } from '../tasks/schemas/task.schema';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI 
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const userModel = mongoose.model<User>(User.name, UserSchema);
    const taskModel = mongoose.model<Task>(Task.name, TaskSchema);

    // Clear existing data
    await userModel.deleteMany({});
    await taskModel.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await userModel.create({
      name: 'Admin User',
      email: 'admin@task.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    });
    console.log('Created admin user:', admin.email);

    // Create member users
    const memberPassword = await bcrypt.hash('member123', 10);
    const member1 = await userModel.create({
      name: 'John Doe',
      email: 'member1@task.com',
      password: memberPassword,
      role: UserRole.MEMBER,
    });
    console.log('Created member user:', member1.email);

    const member2 = await userModel.create({
      name: 'Jane Smith',
      email: 'member2@task.com',
      password: memberPassword,
      role: UserRole.MEMBER,
    });
    console.log('Created member user:', member2.email);

    // Create sample tasks
    const tasks = [
      {
        title: 'Setup project documentation',
        description: 'Create comprehensive documentation for the task manager project',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdBy: admin._id,
        assignedTo: member1._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Implement user authentication',
        description: 'Set up JWT-based authentication system',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        createdBy: member1._id,
        assignedTo: null,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Create task filtering',
        description: 'Add filtering by status and priority',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdBy: member1._id,
        assignedTo: member2._id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Database optimization',
        description: 'Index frequently queried fields',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        createdBy: member2._id,
        assignedTo: null,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ];

    await taskModel.insertMany(tasks);
    console.log('Created 4 sample tasks');

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
