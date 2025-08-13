import mongoose from 'mongoose';
import { Role } from '../models/role';
import { ROLE_PERMISSIONS } from '../permissions';
import { DBConnect } from '../utils/DBConnect';

// Connect to MongoDB before running seed
DBConnect()

export const seedRoles = async () => {
  try {
    // Check if roles already exist
    const existingRoles = await Role.find({});
    if (existingRoles.length > 0) {
      console.log('Roles already exist, skipping seed');
      return;
    }

    // Create Admin role
    const adminRole = new Role({
      name: 'admin',
      permissions: new Map([
        ['products', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('products:'))],
        ['sales', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('sales:'))],
        ['users', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('users:'))],
        ['categories', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('categories:'))],
        ['storage', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('storage:'))],
        ['reports', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('reports:'))],
        ['settings', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('settings:'))],
        ['dashboard', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('dashboard:'))],
      ])
    });

    // Create Staff role
    const staffRole = new Role({
      name: 'staff',
      permissions: new Map([
        ['products', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('products:'))],
        ['sales', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('sales:'))],
        ['categories', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('categories:'))],
        ['storage', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('storage:'))],
      ])
    });

    // Save roles
    await adminRole.save();
    await staffRole.save();

    console.log('Roles seeded successfully!');
    console.log('Admin role created with full permissions');
    console.log('Staff role created with limited permissions');
    
    return { adminRole, staffRole };
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
};

seedRoles()