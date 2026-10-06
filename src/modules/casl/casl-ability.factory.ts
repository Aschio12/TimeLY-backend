import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { User, Workspace, Project, Task, WorkspaceRole, TimeEntry } from '@prisma/client';
import { PrismaQuery, createPrismaAbility } from '@casl/prisma';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects =
  | 'all'
  | InferSubjects<
      typeof User | typeof Workspace | typeof Project | typeof Task | typeof TimeEntry
    >;

export type AppAbility = PureAbility<[Action, Subjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User, workspaceRoles: Record<string, WorkspaceRole>) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    // Super Admin check could go here if we had global roles

    // Iterate over user's workspaces and assign abilities based on their role in that workspace
    for (const [workspaceId, role] of Object.entries(workspaceRoles)) {
      if (role === WorkspaceRole.OWNER) {
        can(Action.Manage, 'Workspace', { id: workspaceId });
        can(Action.Manage, 'Project', { space: { workspaceId } });
        can(Action.Manage, 'Task', { project: { space: { workspaceId } } });
        can(Action.Manage, 'TimeEntry', { workspaceId });
      }

      if (role === WorkspaceRole.ADMIN) {
        can(Action.Read, 'Workspace', { id: workspaceId });
        can(Action.Update, 'Workspace', { id: workspaceId });
        can(Action.Manage, 'Project', { space: { workspaceId } });
        can(Action.Manage, 'Task', { project: { space: { workspaceId } } });
        can(Action.Manage, 'TimeEntry', { workspaceId });
        cannot(Action.Delete, 'Workspace', { id: workspaceId });
      }

      if (role === WorkspaceRole.MEMBER) {
        can(Action.Read, 'Workspace', { id: workspaceId });
        can(Action.Read, 'Project', { space: { workspaceId } });
        can(Action.Read, 'Task', { project: { space: { workspaceId } } });
        can(Action.Update, 'Task', { project: { space: { workspaceId } } });
        
        // Members can only manage their OWN time entries within this workspace
        can(Action.Manage, 'TimeEntry', { workspaceId, userId: user.id });
      }

      if (role === WorkspaceRole.VIEWER) {
        can(Action.Read, 'Workspace', { id: workspaceId });
        can(Action.Read, 'Project', { space: { workspaceId } });
        can(Action.Read, 'Task', { project: { space: { workspaceId } } });
        can(Action.Read, 'TimeEntry', { workspaceId });
      }
    }

    // Users can always manage their own profile
    can(Action.Manage, 'User', { id: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor.name as ExtractSubjectType<Subjects>,
    });
  }
}
