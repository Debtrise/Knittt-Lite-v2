'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Copy, Eye, Play } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { getProjects, createProject, deleteProject, cloneProject, checkDialplanCapabilities } from '@/app/utils/dialplanApi';
import { DialplanProject, DialplanCapabilities } from '@/app/types/dialplan';

export default function DialPlanPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<DialplanProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newProjectName, setNewProjectName] = useState('');
  const [capabilities, setCapabilities] = useState<DialplanCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if dial plan module is available
    const checkCapabilities = async () => {
      try {
        const data = await checkDialplanCapabilities();
        console.log('Dialplan capabilities:', data);
        setCapabilities(data);
        
        // Even if nodeTypes is empty or undefined, we can still proceed
        // since our tests showed the API is working for basic operations
        fetchProjects();
      } catch (error) {
        console.error('Error checking dial plan capabilities:', error);
        setError('Failed to connect to dial plan service. Please try again later.');
        setIsLoading(false);
        toast.error('Failed to connect to dial plan service');
      }
    };

    checkCapabilities();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      console.log('Projects data:', data);
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load dialplan projects. Please try again later.');
      toast.error('Failed to load dial plan projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdProject = await createProject(newProject);
      console.log('Created project:', createdProject);
      toast.success('Project created successfully');
      setNewProject({ name: '', description: '' });
      setShowNewProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteProject(id);
      console.log('Delete result:', result);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleCloneProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const clonedProject = await cloneProject(selectedProjectId, newProjectName);
      console.log('Cloned project:', clonedProject);
      toast.success('Project cloned successfully');
      setNewProjectName('');
      setShowCloneForm(false);
      setSelectedProjectId(null);
      fetchProjects();
    } catch (error) {
      console.error('Error cloning project:', error);
      toast.error('Failed to clone project');
    }
  };

  const openCloneForm = (id: number, currentName: string) => {
    setSelectedProjectId(id);
    setNewProjectName(`${currentName} Copy`);
    setShowCloneForm(true);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isLoading && !capabilities) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Asterisk Dial Plan Builder</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Checking Dial Plan Builder capabilities...</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Asterisk Dial Plan Builder</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (capabilities && (!capabilities.capabilities || !capabilities.capabilities.generator)) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Asterisk Dial Plan Builder</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-red-600 mb-2">Dial Plan Builder Module Limited</h3>
              <p className="text-gray-500 mb-4">
                The Asterisk Dial Plan Builder module has limited capabilities. Some features may not work properly.
              </p>
              <p className="text-sm text-gray-400">
                Message: {capabilities.message}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Asterisk Dial Plan Builder</h1>
          <Button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {showNewProjectForm && (
          <div className="mb-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Input
                    id="projectName"
                    label="Project Name"
                    type="text"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      rows={3}
                      className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                      value={newProject.description}
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowNewProjectForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newProject.name}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        )}

        {showCloneForm && (
          <div className="mb-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Clone Project</h2>
            <form onSubmit={handleCloneProject}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Input
                    id="newProjectName"
                    label="New Project Name"
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCloneForm(false);
                    setSelectedProjectId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newProjectName}
                >
                  Clone Project
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Dial Plan Projects</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage Asterisk dial plan configurations.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new dial plan project.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Deployed
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map(project => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-md truncate">{project.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.lastDeployed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => router.push(`/dialplan/${project.id}`)}
                          variant="outline"
                          size="sm"
                          className="text-brand"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => openCloneForm(project.id, project.name)}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Clone
                        </Button>
                        <Button
                          onClick={() => handleDeleteProject(project.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 