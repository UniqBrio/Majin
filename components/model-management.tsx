"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ModelManagement() {
  const { toast } = useToast()
  const [models, setModels] = useState<any[]>([]) // Use local state instead of store
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "",
    apiKey: "",
    type: "text",
    description: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const contentTypes = [
    { value: "text", label: "Text" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "3d", label: "3D" },
  ]

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models")
      console.log("API Response:", response);  // Log to browser console

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      const data = await response.json()
      setModels(data)
    } catch (error: any) {
      console.error("Full error fetching models:", {
        message: error.message,
        stack: error.stack,
        response: error.response // if available
      });
      toast({
        title: "Error fetching models",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.provider || !newModel.apiKey) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newModel),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add model: ${response.statusText}`);
      }

      const data = await response.json();

      toast({
        title: "Model added",
        description: `${newModel.name} has been added successfully.`,
      });

      // Reset form and refresh models
      setNewModel({
        name: "",
        provider: "",
        apiKey: "",
        type: "text",
        description: "",
      });
      setIsDialogOpen(false);
      fetchModels();
    } catch (error: any) {
      console.error("Error adding model:", error);
      toast({
        title: "Error adding model",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch("/api/models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, active }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update model: ${response.statusText}`)
      }

      toast({
        title: active ? "Model activated" : "Model deactivated",
        description: `Model has been ${active ? "activated" : "deactivated"}.`,
      })

      fetchModels()
    } catch (error: any) {
      console.error("Error updating model:", error)
      toast({
        title: "Error updating model",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRemoveModel = async (id: string) => {
    try {
      const response = await fetch("/api/models", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to remove model: ${response.statusText}`)
      }

      toast({
        title: "Model removed",
        description: "The model has been removed successfully.",
      })

      fetchModels()
    } catch (error: any) {
      console.error("Error removing model:", error)
      toast({
        title: "Error removing model",
        description: error.message,
        variant: "destructive",
      })
    }
    setShowApiKey((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getModelsByType = (type: string) => {
    return models.filter((model) => model.type === type)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Model Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New AI Model</DialogTitle>
              <DialogDescription>
                Enter the details for the new AI model. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., GPT-4, DALL-E 3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="provider" className="text-right">
                  Provider *
                </Label>
                <Input
                  id="provider"
                  value={newModel.provider}
                  onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., OpenAI, Anthropic"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={newModel.apiKey}
                  onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter API key"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type *
                </Label>
                <Select value={newModel.type} onValueChange={(value) => setNewModel({ ...newModel, type: value })}>
                  <SelectTrigger id="type" className="col-span-3">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddModel}>Add Model</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="text">
        <TabsList className="mb-4">
          {contentTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label} Models
            </TabsTrigger>
          ))}
        </TabsList>

        {contentTypes.map((type) => (
          <TabsContent key={type.value} value={type.value}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getModelsByType(type.value).length > 0 ? (
                getModelsByType(type.value).map((model) => (
                  <Card key={model.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{model.name}</CardTitle>
                          <CardDescription>{model.provider}</CardDescription>
                        </div>
                        <Switch
                          checked={model.active}
                          onCheckedChange={(checked) => handleToggleActive(model.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">API Key</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              value={showApiKey[model.id] ? model.apiKey : "•".repeat(16)}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleApiKeyVisibility(model.id)}
                              className="ml-2"
                            >
                              {showApiKey[model.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        {model.description && (
                          <div>
                            <Label className="text-sm">Description</Label>
                            <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="px-6 pb-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to remove this model?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the model and remove its data
                              from the server.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveModel(model.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>No {type.label} Models</CardTitle>
                    <CardDescription>You haven't added any {type.label.toLowerCase()} models yet.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {type.label} Model
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
