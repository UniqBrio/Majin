"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ContentDisplay } from "@/components/content-display"
import LLMResultsDisplay from "@/components/LLMResultsDisplay" // Import the new component
import { useToast } from "@/hooks/use-toast"

export function Dashboard() {
  const { toast } = useToast()
  const { models, setModels, addModel } = useStore() // Destructure setModels
  const [contentType, setContentType] = useState("text")
  const [prompt, setPrompt] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const contentTypes = [
    { value: "text", label: "Text" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "3d", label: "3D" },
  ]

  const MAX_SELECTED_MODELS = 5
  const filteredModels = (Array.isArray(models) ? models : []).filter((model) => model.type === contentType && model.active)

  useEffect(() => {
    // Fetch initial models when the component mounts
    // and set default selected models for the initial content type.
    let isMounted = true
    const fetchModelsAndSetDefault = async () => {
      try {
        const response = await fetch("/api/models")
        if (!response.ok) throw new Error("Failed to fetch models")
        const allFetchedModels = await response.json() // Renamed for clarity
        if (!isMounted) return

        setModels(allFetchedModels) // Populate the store

        // Default selection logic for initial load
        if (Array.isArray(allFetchedModels)) {
          // 'contentType' here will be its initial state value ("text")
          // as this effect runs once on mount.
          const activeModelsForInitialType = allFetchedModels
            .filter((model: any) => model.type === contentType && model.active)
            .slice(0, MAX_SELECTED_MODELS)
            .map((model: any) => model.id)
          setSelectedModels(activeModelsForInitialType)
        }
      } catch (error) {
        console.error("Error fetching models:", error)
        if (isMounted) {
          toast({ title: "Error", description: "Could not load models from the server.", variant: "destructive" })
        }
      }
    }
    fetchModelsAndSetDefault()
    return () => {
      isMounted = false
    }
  }, [setModels, toast, contentType, MAX_SELECTED_MODELS]) // contentType and MAX_SELECTED_MODELS added for completeness,
                                                           // though their initial values are used for the "on start" behavior.

  useEffect(() => {
    // Reset selected models when content type changes
    setSelectedModels([])
  }, [contentType])

  useEffect(() => {
    // Add ESC key handler to stop generation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGenerating) {
        stopGeneration()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isGenerating])

  const handleModelSelect = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId)
      } else {
        // Limit to MAX_SELECTED_MODELS models
        if (prev.length >= MAX_SELECTED_MODELS) {
          toast({
            title: "Maximum models reached",
            description: `You can select up to ${MAX_SELECTED_MODELS} models at a time.`,
            variant: "destructive",
          })
          return prev
        }
        return [...prev, modelId]
      }
    })
  }

  const handleSelectAllModels = (isChecked: boolean) => {
    if (isChecked) {
      const modelsToSelectIds = filteredModels.slice(0, MAX_SELECTED_MODELS).map(model => model.id);
      setSelectedModels(modelsToSelectIds);
      if (filteredModels.length > MAX_SELECTED_MODELS) {
        toast({
          title: "Model Limit Reached",
          description: `Selected the first ${MAX_SELECTED_MODELS} available models. You can select up to ${MAX_SELECTED_MODELS} models.`,
          // Default toast variant will be used
        });
      }
    } else {
      setSelectedModels([]);
    }
  };

  const relevantModelsForSelectAll = filteredModels.slice(0, MAX_SELECTED_MODELS);
  const isAllEffectivelySelected = relevantModelsForSelectAll.length > 0 && selectedModels.length === relevantModelsForSelectAll.length && relevantModelsForSelectAll.every(model => selectedModels.includes(model.id));

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate content.",
        variant: "destructive",
      })
      return
    }

    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to generate content.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setResults([])

    // Simulate content generation with different models
    try {
      const selectedModelDetails = models.filter((model) => selectedModels.includes(model.id))

      const generatedResults = await Promise.all(
        selectedModelDetails.map(async (model) => {
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

          return {
            modelId: model.id,
            modelName: model.name,
            content: await generateMockContent(contentType, prompt, model.name), // Added await here
            timestamp: new Date().toISOString(),
          }
        }),
      )

      setResults(generatedResults)

      // Save to MongoDB (would be implemented with actual API)
      saveResultsToDatabase(generatedResults)

      toast({
        title: "Content generated",
        description: `Successfully generated content with ${selectedModels.length} model(s).`,
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "An error occurred while generating content.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const stopGeneration = () => {
    setIsGenerating(false)
    toast({
      title: "Generation stopped",
      description: "Content generation has been stopped.",
    })
  }

  const saveResultsToDatabase = async (results: any[]) => {
   
    console.log("Saving results to MongoDB:", results)
    
  }

  const generateMockContent = async (type: string, prompt: string, modelName: string) => {
    if (type === "text") {
      try {
        // Make API call to your server-side route
        const response = await fetch("/api/generate-text", {  // Assuming your route is at /api/generate-text
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modelName,
            prompt,
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.completion;  // Assuming your API returns { completion: "..." }
      } catch (error: any) {
        console.error("Error generating text:", error);
        return `Error generating text: ${error.message}`; // Handle errors gracefully
      }
    } else {
      // For other content types, keep the mock responses for now
      switch (type) {
        case "image": return `/placeholder.svg?height=300&width=300&text=Generated+Image+from+${modelName}`;
        case "video": return "Video generation simulation (would be a video player in production)";
        case "audio": return "Audio generation simulation (would be an audio player in production)";
        case "3d": return "3D model generation simulation (would be a 3D viewer in production)";
        default: return "Content generated successfully";
      }
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPrompt(value)

    // Show warning if prompt exceeds 20000 characters
    if (value.length > 20000) {
      toast({
        title: "Prompt too long",
        description: "Your prompt has been truncated to 20000 characters.",
        // variant: "warning", // Removed as "warning" is not a valid variant
      })
      setPrompt(value.substring(0, 20000))
      if (textareaRef.current) {
        textareaRef.current.value = value.substring(0, 20000)
      }
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Majin</h1>
        <div className="flex items-center space-x-4">
          <Label htmlFor="content-type" className="whitespace-nowrap">Content Type *</Label>
          <Select value={contentType} onValueChange={setContentType} disabled={isGenerating}>
            <SelectTrigger id="content-type">
              <SelectValue /> {/* Removed placeholder */}
            </SelectTrigger>
            <SelectContent>
              {contentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear the prompt, selected models, and generated results?")) {
                setPrompt("")
                setSelectedModels([])
                setResults([])
              }
            }}
            disabled={isGenerating}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"> {/* Changed from lg:grid-cols-2 to lg:grid-cols-5 */}
        <Card className="col-span-1 lg:col-span-2"> {/* Left card takes 2 of 5 columns on large screens */}
          <CardHeader>
            <CardDescription>Select models and enter a prompt to generate content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Content Type Label and Select were moved to the header */}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Select Models * (max {MAX_SELECTED_MODELS})</Label>
                  {filteredModels.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-models"
                        checked={isAllEffectivelySelected}
                        onCheckedChange={(checked) => handleSelectAllModels(Boolean(checked))}
                        disabled={isGenerating}
                      />
                      <Label htmlFor="select-all-models" className="text-sm font-normal cursor-pointer">
                        Select All
                      </Label>
                    </div>
                  )}
                </div>
                {filteredModels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                    {filteredModels.map((model) => (
                      <div key={model.id} className="flex items-center space-x-1 p-1 border rounded-md">
                        <Checkbox
                          id={`model-${model.id}`}
                          checked={selectedModels.includes(model.id)}
                          onCheckedChange={() => handleModelSelect(model.id)}
                          disabled={isGenerating || (selectedModels.length >= MAX_SELECTED_MODELS && !selectedModels.includes(model.id))}
                        />
                        <Label htmlFor={`model-${model.id}`} className="flex-1 cursor-pointer">
                          <span className="text-sm">{model.name}</span>
                          <span className="text-xs text-muted-foreground block">{model.provider}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No active models available for {contentType} content. Please add models in the Models section.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  className="min-h-[240px]"
                  value={prompt}
                  onChange={handlePromptChange}
                  disabled={isGenerating}
                  ref={textareaRef}
                />

              </div>
            </div>
          </CardContent> 
          <CardFooter className="flex justify-end"> {/* Changed justify-between to justify-end */}
            {isGenerating ? (
              <Button variant="destructive" onClick={stopGeneration}>
                Stop Generation (ESC)
              </Button>
            ) : (
              <Button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim() || selectedModels.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="col-span-1 lg:col-span-3"> {/* Right card takes 3 of 5 columns on large screens */}
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>View generated content from selected models</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Generating content with {selectedModels.length} model(s)...</p>
                <p className="text-sm text-muted-foreground mt-2">Press ESC to cancel</p>
              </div>
            ) : results.length > 0 ? ( // Check if there are any results
              contentType === "text" ? ( // If content type is text, use LLMResultsDisplay
                <LLMResultsDisplay
                  results={results.map((result) => ({
                    id: result.modelId, // Map modelId to id
                    modelName: result.modelName,
                    completion: result.content, // Map content to completion
                  }))}
                />
              ) : (
                // For other content types, use the existing Tabs and ContentDisplay
                <Tabs defaultValue={results[0].modelId}>
                  <TabsList className="w-full">
                    {results.map((result) => (
                      <TabsTrigger key={result.modelId} value={result.modelId} className="flex-1">
                        {result.modelName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {results.map((result) => (
                    <TabsContent key={result.modelId} value={result.modelId}>
                      <ContentDisplay type={contentType} content={result.content} modelName={result.modelName} />
                    </TabsContent>
                  ))}
                </Tabs>
              )
            ) : (
              <div className="text-center p-12 text-muted-foreground">
                No content generated yet. Enter a prompt and select models to generate content.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}