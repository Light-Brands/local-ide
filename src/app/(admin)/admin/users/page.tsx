'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  Trash2,
  Edit,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colors, statusColors } from '@/lib/design/tokens';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

// Demo users data
const usersData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '2024-01-15',
    avatar: null,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'editor',
    status: 'active',
    lastActive: '2024-01-14',
    avatar: null,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'user',
    status: 'active',
    lastActive: '2024-01-13',
    avatar: null,
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'editor',
    status: 'inactive',
    lastActive: '2024-01-01',
    avatar: null,
  },
  {
    id: '5',
    name: 'Alex Brown',
    email: 'alex@example.com',
    role: 'user',
    status: 'active',
    lastActive: '2024-01-12',
    avatar: null,
  },
];

const roleColors = {
  admin: cn(colors.primary.text, colors.primary.bg),
  editor: cn(colors.secondary.text, colors.secondary.bg),
  user: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800',
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Users
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors'
          )}
          aria-label="Add new user"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add User
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative flex-1 max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
          )}
          aria-label="Search users"
        />
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants} className={cn(
        'p-5 rounded-xl border overflow-hidden',
        'bg-white dark:bg-neutral-900',
        'border-neutral-200/60 dark:border-neutral-800/60'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="grid">
            <thead>
              <tr className="border-b border-neutral-200/60 dark:border-neutral-800/60">
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">User</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Role</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Last Active</th>
                <th scope="col" className="w-12 py-3 px-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white', colors.primary.solid)} aria-hidden="true">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize', roleColors[user.role as keyof typeof roleColors])}>
                      <Shield className="w-3 h-3" aria-hidden="true" />
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        user.status === 'active'
                          ? cn(colors.success.text, colors.success.bg)
                          : 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                      )}
                    >
                      {user.status === 'active' ? (
                        <UserCheck className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <UserX className="w-3 h-3" aria-hidden="true" />
                      )}
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <time className="text-sm text-neutral-500 dark:text-neutral-400">
                      {user.lastActive}
                    </time>
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative group">
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={`Actions for ${user.name}`} aria-haspopup="menu">
                        <MoreHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                      </button>
                      <div className={cn(
                        'absolute right-0 mt-1 w-40 rounded-xl border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden p-1',
                        'bg-white dark:bg-neutral-900',
                        'border-neutral-200 dark:border-neutral-800'
                      )} role="menu">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" role="menuitem">
                          <Mail className="w-4 h-4" aria-hidden="true" />
                          Email
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" role="menuitem">
                          <Edit className="w-4 h-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors', colors.error.text, colors.error.bg.replace('bg-', 'hover:bg-'))} role="menuitem">
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
