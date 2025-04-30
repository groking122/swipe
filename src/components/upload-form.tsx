"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "./ui/button" // Corrected path
import { Input } from "./ui/input" // Corrected path
import { Label } from "./ui/label" // Corrected path
import { Textarea } from "./ui/textarea" // Corrected path
import { useToast } from "./ui/use-toast" // Corrected path
import { Upload, X } from "lucide-react"
import { uploadMemeAction } from "@/app/_actions/uploadMeme" // Import the server action
import { useUser } from "@clerk/nextjs"; // Import useUser
import { LoginRequiredModal } from "./login-required-modal"; // Import the modal

export default function UploadForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for modal
  const { toast } = useToast()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser(); // Get user status

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) input.value = '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) return; // Wait for Clerk

    // Check if signed in before validating form or uploading
    if (!isSignedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!imageFile) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }
    if (!title) {
        toast({
          title: "Title required",
          description: "Please enter a title for your meme",
          variant: "destructive",
        })
        return
      }

    setIsUploading(true)

    const formData = new FormData();
    formData.append('title', title);
    if (description) {
        formData.append('description', description);
    }
    formData.append('image', imageFile);

    try {
      console.log("[Form] Calling uploadMemeAction...");
      const result = await uploadMemeAction(formData); 
      console.log("[Form] uploadMemeAction result:", result);

      if (result?.error) {
          throw new Error(result.error);
      }

      toast({
        title: "Meme uploaded!",
        description: "Your meme has been successfully uploaded",
      })

      router.push("/");

    } catch (error) {
      console.error("[Form] Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your meme",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6 dark:border-neutral-800">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your meme a catchy title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some context to your meme"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Meme Image</Label>

          {imagePreview ? (
            <div className="relative mt-2 rounded-lg border dark:border-neutral-700">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 z-10 h-8 w-8"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="relative h-64 w-full overflow-hidden rounded-lg">
                <Image src={imagePreview || "/placeholder.svg"} alt="Meme preview" fill className="object-contain" />
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
              <Upload className="mb-4 h-10 w-10 text-neutral-400" />
              <div className="mb-2 text-sm font-medium">
                <label htmlFor="image" className="cursor-pointer text-rose-500 hover:text-rose-600">
                  Click to upload
                </label>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-neutral-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}

          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden" // Keep hidden, use label trigger
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isUploading || !imageFile || !title}>
            {isUploading ? "Uploading..." : "Upload Meme"}
          </Button>
        </div>
      </form>

      {/* Render the modal */}
      <LoginRequiredModal isOpen={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  )
} 