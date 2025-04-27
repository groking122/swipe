"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs" // Corrected path
import { Card, CardContent } from "./ui/card" // Corrected path
import { Button } from "./ui/button" // Corrected path
import { Settings, Upload, Trash2, Heart } from "lucide-react"
import { motion } from "framer-motion"
import Link from 'next/link'; // Import Link

// Mock data for uploaded memes
const mockUploadedMemes = [
  {
    id: "u1",
    imageUrl: "/distracted-boyfriend-generic.png",
    title: "My First Meme",
    likes: 42,
    dislikes: 5,
    dateUploaded: "2023-04-15",
  },
  {
    id: "u2",
    imageUrl: "/surprised-cat-calculator.png",
    title: "Math Problems",
    likes: 78,
    dislikes: 3,
    dateUploaded: "2023-05-22",
  },
  {
    id: "u3",
    imageUrl: "/surprised-cat-computer.png",
    title: "Coding Be Like",
    likes: 103,
    dislikes: 12,
    dateUploaded: "2023-06-10",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

// TODO: Fetch actual user data and memes
export default function AccountContent() {
  const [uploadedMemes, setUploadedMemes] = useState(mockUploadedMemes)

  const handleDeleteMeme = (id: string) => {
    // TODO: Implement actual delete logic (e.g., call server action)
    console.log("Deleting meme (mock):", id);
    setUploadedMemes(uploadedMemes.filter((meme) => meme.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* User profile section - TODO: Replace with real data */}
      <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
            <div className="absolute inset-0.5 overflow-hidden rounded-full bg-white dark:bg-neutral-900">
              {/* Placeholder avatar */} 
              <Image src="/placeholder-avatar.svg" alt="User avatar" fill className="object-cover" />
            </div>
          </div>
          <div>
            {/* TODO: Get username from Clerk/DB */} 
            <h2 className="text-xl font-bold">Your Username</h2>
            {/* TODO: Get join date from Clerk/DB */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Member since...</p> 
            <div className="mt-1 flex gap-3">
              {/* TODO: Get real stats from DB */}
              <span className="text-xs font-medium text-neutral-500">
                <span className="font-bold text-indigo-600">{uploadedMemes.length}</span> Uploads
              </span>
              <span className="text-xs font-medium text-neutral-500">
                <span className="font-bold text-indigo-600">...</span> Likes
              </span>
            </div>
          </div>
          {/* Remove Edit Profile button for now, handled by Clerk UserProfile usually */}
          {/* <Button variant="outline" size="sm" className="ml-auto">
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Button> */}
        </div>
      </div>

      {/* Tabs for different account sections */}
      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="uploads"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-400"
          >
            <Upload className="mr-2 h-4 w-4" />
            Your Uploads
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-400"
          >
            <Heart className="mr-2 h-4 w-4" />
            Liked Memes
          </TabsTrigger>
        </TabsList>

        {/* Uploaded Memes Tab */}
        <TabsContent value="uploads" className="mt-6">
          {/* TODO: Fetch user's uploaded memes from DB */}
          <h3 className="mb-4 text-lg font-medium">Your Uploaded Memes</h3>

          {uploadedMemes.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {uploadedMemes.map((meme) => (
                <motion.div key={meme.id} variants={item}>
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-md dark:bg-neutral-800">
                    <div className="relative aspect-square">
                      <Image src={meme.imageUrl || "/placeholder.svg"} alt={meme.title} fill className="object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{meme.title}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 text-indigo-500" />
                              <span className="text-xs font-medium">{meme.likes}</span>
                            </div>
                            <span className="text-xs text-neutral-500">•</span>
                            <span className="text-xs text-neutral-500">{meme.dateUploaded}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-500 hover:text-rose-500"
                          onClick={() => handleDeleteMeme(meme.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
              <Upload className="mb-4 h-10 w-10 text-neutral-400" />
              <h3 className="mb-2 text-lg font-medium">No memes uploaded yet</h3>
              <p className="mb-4 text-sm text-neutral-500">Your uploaded memes will appear here</p>
              <Button
                asChild
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Link href="/upload">Upload Your First Meme</Link> { /* Use Link */ }
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Liked Memes Tab - TODO: Implement fetching liked memes */}
        <TabsContent value="liked" className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Memes You've Liked</h3>

          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
            <Heart className="mb-4 h-10 w-10 text-neutral-400" />
            <h3 className="mb-2 text-lg font-medium">No liked memes yet</h3>
            <p className="mb-4 text-sm text-neutral-500">Memes you like will appear here</p>
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Link href="/">Browse Memes</Link> { /* Use Link */ }
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 