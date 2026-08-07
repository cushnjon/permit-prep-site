import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

const ARCHIVE_PASSWORD = "permitprep";

export default function CertificateArchive() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { data: certificates = [], isLoading } = trpc.certificate.list.useQuery(
    undefined,
    { enabled: isUnlocked }
  );

  const handleUnlock = () => {
    if (password === ARCHIVE_PASSWORD) {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  if (!isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <Lock className="w-12 h-12 mx-auto text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Certificate Archive</h1>
            <p className="text-gray-600">Enter password to access the archive</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
              className="text-center"
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <Button
              onClick={handleUnlock}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Unlock Archive
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Certificate Archive</h1>
          <p className="text-gray-600">All generated certificates ({certificates.length} total)</p>
        </div>

        <div className="space-y-4">
          {isLoading && <p className="text-center text-gray-600">Loading certificates...</p>}
          {certificates.map((cert: any, idx: number) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-slate-900">{cert.userName}</p>
                      <p className="text-sm text-gray-600">
                        Score: {cert.score}% • {cert.questionCount} Questions
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Generated: {new Date(cert.createdAt).toLocaleDateString()} {new Date(cert.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {certificates.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No certificates in the archive yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
