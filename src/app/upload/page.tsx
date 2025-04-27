import UploadForm from "../../components/upload-form"; // Corrected path

export default function UploadPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Upload New Meme</h1>
      <UploadForm />
    </div>
  );
} 