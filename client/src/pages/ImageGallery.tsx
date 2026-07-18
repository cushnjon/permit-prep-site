import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { gameData } from "@/data/gameData";

interface GalleryImage {
  id: string;
  title: string;
  url: string;
  questionText: string;
  questionText_es?: string;
  zone: string;
}

export default function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showSpanish, setShowSpanish] = useState(false);

  // Extract all images from gameData
  const galleryImages: GalleryImage[] = [];
  gameData.forEach((zone) => {
    zone.questions.forEach((question) => {
      if (question.images && question.images.length > 0) {
        question.images.forEach((img) => {
          galleryImages.push({
            id: question.id,
            title: question.id.replace(/_/g, " "),
            url: img,
            questionText: question.prompt,
            questionText_es: question.prompt_es,
            zone: zone.zone,
          });
        });
      }
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 font-medium"
          >
            <ChevronLeft size={20} />
            Back to Quiz
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">DMV Learning Gallery</h1>
              <p className="text-gray-600">Browse all {galleryImages.length} illustrations from the Permit Prep quiz</p>
            </div>
            <button
              onClick={() => setShowSpanish(!showSpanish)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-yellow-100 hover:bg-yellow-200 text-yellow-900"
            >
              {showSpanish ? "English" : "Espanol"}
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-white"
            >
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-1">{image.zone}</p>
                <p className="text-sm font-medium text-gray-900 text-left line-clamp-2">{image.questionText}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{selectedImage.zone}</p>
                <h2 className="text-xl font-bold text-gray-900">{selectedImage.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedImage.questionText_es && (
                  <button
                    onClick={() => setShowSpanish(!showSpanish)}
                    className="px-2 py-1 rounded text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold transition-colors"
                  >
                    {showSpanish ? "English" : "Español"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full rounded-lg mb-6 shadow-md"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Question:</p>
                <p className="text-gray-900 font-medium">{showSpanish && selectedImage.questionText_es ? selectedImage.questionText_es : selectedImage.questionText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
