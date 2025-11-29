"use client";

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="w-16 h-16 mb-6 text-white/40">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      
      <p className="text-white/60 mb-6 max-w-md">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Link
            href={action.href}
            onClick={action.onClick}
            className="btn btn-primary px-6 py-3"
          >
            {action.label}
          </Link>
        )}
        
        {secondaryAction && (
          <Link
            href={secondaryAction.href}
            onClick={secondaryAction.onClick}
            className="btn btn-outline px-6 py-3"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

// Specialized empty state components
export function EmptyProjectsState() {
  const ProjectIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  return (
    <EmptyState
      icon={<ProjectIcon />}
      title="No Projects Found"
      description="Start your journey by creating your first project pitch and connecting with investors."
      action={{
        label: "Create Project",
        href: "/founder/pitch"
      }}
      secondaryAction={{
        label: "Browse Projects",
        href: "/projects"
      }}
    />
  );
}

export function EmptyDealsState() {
  const DealIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <EmptyState
      icon={<DealIcon />}
      title="No Deals Yet"
      description="Your deal discussions will appear here once you start connecting with other users."
      action={{
        label: "Browse Projects",
        href: "/projects"
      }}
      secondaryAction={{
        label: "Explore Opportunities",
        href: "/opportunities"
      }}
    />
  );
}

export function EmptyNotificationsState() {
  const NotificationIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <EmptyState
      icon={<NotificationIcon />}
      title="No Notifications"
      description="You're all caught up! New notifications will appear here when they arrive."
      action={{
        label: "Go to Dashboard",
        href: "/dashboard"
      }}
    />
  );
}

export function EmptyChatState() {
  const ChatIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <EmptyState
      icon={<ChatIcon />}
      title="No Messages Yet"
      description="Start the conversation by sending your first message in this deal room."
      action={{
        label: "Send Message",
        href: "#",
        onClick: () => {
          // Focus on message input
          const input = document.querySelector('input[type="text"], textarea');
          if (input) (input as HTMLElement).focus();
        }
      }}
    />
  );
}

export function EmptyTasksState() {
  const TaskIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  return (
    <EmptyState
      icon={<TaskIcon />}
      title="No Tasks"
      description="All tasks are complete! Create new tasks to keep track of your progress."
      action={{
        label: "Create Task",
        href: "#",
        onClick: () => {
          // Trigger task creation modal
          console.log('Create task clicked');
        }
      }}
    />
  );
}

export function EmptyFilesState() {
  const FileIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <EmptyState
      icon={<FileIcon />}
      title="No Files"
      description="Upload files to share documents, images, and other resources with your team."
      action={{
        label: "Upload File",
        href: "#",
        onClick: () => {
          // Trigger file upload
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.click();
        }
      }}
    />
  );
}

export function EmptySearchResultsState({ query }: { query: string }) {
  const SearchIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <EmptyState
      icon={<SearchIcon />}
      title="No Results Found"
      description={`No results found for "${query}". Try adjusting your search terms or browse our featured content.`}
      action={{
        label: "Clear Search",
        href: "#",
        onClick: () => {
          // Clear search
          window.history.replaceState({}, '', window.location.pathname);
        }
      }}
      secondaryAction={{
        label: "Browse All",
        href: "/projects"
      }}
    />
  );
}

export function EmptyDashboardState({ role }: { role: string }) {
  const DashboardIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    </svg>
  );

  const getRoleSpecificContent = () => {
    switch (role) {
      case 'founder':
        return {
          title: "Welcome to Your Founder Dashboard",
          description: "Start by completing your profile, verifying your identity, and creating your first project pitch.",
          primaryAction: { label: "Create Pitch", href: "/founder/pitch" },
          secondaryAction: { label: "Complete Profile", href: "/founder/profile" }
        };
      case 'vc':
        return {
          title: "Welcome to Your VC Dashboard",
          description: "Discover promising projects, review deal flow, and connect with innovative founders.",
          primaryAction: { label: "Browse Projects", href: "/projects" },
          secondaryAction: { label: "View Deal Flow", href: "/vc/dealflow" }
        };
      case 'exchange':
        return {
          title: "Welcome to Your Exchange Dashboard",
          description: "Review listing applications, manage exchange operations, and connect with projects.",
          primaryAction: { label: "View Applications", href: "/exchange/applications" },
          secondaryAction: { label: "Manage Listings", href: "/exchange/listings" }
        };
      default:
        return {
          title: "Welcome to Cryptorafts",
          description: "Explore the crypto ecosystem and discover opportunities that match your interests.",
          primaryAction: { label: "Get Started", href: "/role" },
          secondaryAction: { label: "Browse Projects", href: "/projects" }
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <EmptyState
      icon={<DashboardIcon />}
      title={content.title}
      description={content.description}
      action={{
        label: content.primaryAction.label,
        href: content.primaryAction.href
      }}
      secondaryAction={{
        label: content.secondaryAction.label,
        href: content.secondaryAction.href
      }}
    />
  );
}
