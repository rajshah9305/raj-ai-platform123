import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4">
      <Card className="w-full max-w-lg shadow-xl border-gray-200 bg-white">
        <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-12 w-12 sm:h-16 sm:w-16 text-orange-500" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
            404
          </h1>

          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">
            Page Not Found
          </h2>

          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
