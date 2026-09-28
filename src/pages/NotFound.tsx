import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-9xl font-bold text-primary/50 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => window.history.back()}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;