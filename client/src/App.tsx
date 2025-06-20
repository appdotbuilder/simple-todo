import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Load tasks on component mount
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    setIsLoading(true);
    try {
      const taskInput: CreateTaskInput = {
        description: newTaskDescription.trim()
      };
      const newTask = await trpc.createTask.mutate(taskInput);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling task completion
  const handleToggleTask = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => (t.id === task.id ? updatedTask : t))
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await trpc.deleteTask.mutate({ id: taskId });
      if (response.success) {
        setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((task: Task) => !task.completed);
  const completedTasks = tasks.filter((task: Task) => task.completed);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">⬛ TODO</h1>
            <p className="text-muted-foreground text-lg">Minimalist task management</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Add new task form */}
        <Card className="mb-8 border-2 border-border shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-foreground font-bold">Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="flex gap-3">
              <Input
                value={newTaskDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTaskDescription(e.target.value)
                }
                placeholder="What needs to be done?"
                className="flex-1 bg-input border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newTaskDescription.trim()}
                className="bg-foreground text-background hover:bg-foreground/90 border-2 border-foreground font-semibold"
              >
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks list */}
        <Card className="border-2 border-border shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-foreground text-xl font-bold">
              <span>Tasks</span>
              <span className="text-sm font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                {tasks.length} total • {completedTasks.length} done
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">⬜</div>
                <p className="text-xl mb-2 font-medium">No tasks yet</p>
                <p className="text-muted-foreground">Add your first task above to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Incomplete tasks */}
                {incompleteTasks.length > 0 && (
                  <div>
                    <h3 className="font-bold text-foreground mb-4 text-lg border-b border-border pb-2">
                      □ TO DO ({incompleteTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {incompleteTasks.map((task: Task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 p-4 bg-card border-2 border-border rounded-lg hover:bg-accent transition-all hover:shadow-md"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task)}
                            id={`task-${task.id}`}
                          />
                          <label
                            htmlFor={`task-${task.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <span className="text-foreground font-medium">{task.description}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created {task.created_at.toLocaleDateString()}
                            </div>
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-background hover:bg-destructive border-2 border-destructive/30 hover:border-destructive font-bold min-w-8 h-8"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator between incomplete and completed tasks */}
                {incompleteTasks.length > 0 && completedTasks.length > 0 && (
                  <Separator className="my-6 bg-border h-px" />
                )}

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="font-bold text-foreground mb-4 text-lg border-b border-border pb-2">
                      ■ COMPLETED ({completedTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {completedTasks.map((task: Task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 p-4 bg-muted border-2 border-border rounded-lg opacity-70"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task)}
                            id={`task-${task.id}`}
                          />
                          <label
                            htmlFor={`task-${task.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <span className="text-muted-foreground line-through">
                              {task.description}
                            </span>
                            <div className="text-xs text-muted-foreground/60 mt-1">
                              Created {task.created_at.toLocaleDateString()}
                            </div>
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-background hover:bg-destructive border-2 border-destructive/30 hover:border-destructive font-bold min-w-8 h-8"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground text-sm">
          <div className="border-t border-border pt-6">
            <p className="font-medium">⬛ BLACK & WHITE TODO</p>
            <p className="text-xs mt-1">Minimalist • Focused • Effective</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;