import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  CheckCircle,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const HealthCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    severity: string;
    analysis: string;
    disclaimer: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, or PNG report.",
          variant: "destructive",
        });
        return;
      }
      setReportFile(file);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const handleAnalyze = async () => {
    setError(null);

    if (!symptoms.trim()) {
      setError("Please describe your symptoms.");
      return;
    }

    if (!age.trim() || !gender.trim()) {
      setError("Please provide your age and gender.");
      return;
    }

    setIsAnalyzing(true);

    // Simulated AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        severity: "medium",
        analysis:
          "Based on your description, it seems like mild fatigue possibly due to dehydration or overexertion. Ensure rest and hydration.",
        disclaimer:
          "This analysis is AI-generated and not a substitute for professional medical advice.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full mb-6">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Health Self-Check
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe your symptoms and get AI-powered health guidance tailored
              for farmers.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Tell us about your symptoms
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        onValueChange={(value) => setGender(value)}
                        value={gender}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Describe your symptoms</Label>
                    <Textarea
                      placeholder="Example: Feeling weak, headache for 3 days..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>

                  <div>
                    <Label>Upload Medical Report (optional)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    {reportFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploaded: <span>{reportFile.name}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-glow"
                    size="lg"
                  >
                    {isAnalyzing ? "Analyzing symptoms..." : "Get AI Health Guidance"}
                  </Button>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {analysisResult && (
                <Card className="shadow-elegant">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Your Health Analysis
                      </CardTitle>
                      <Badge className={getSeverityColor(analysisResult.severity)}>
                        {analysisResult.severity.toUpperCase()} SEVERITY
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      {analysisResult.analysis}
                    </p>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {analysisResult.disclaimer}
                      </AlertDescription>
                    </Alert>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setAnalysisResult(null);
                        setSymptoms("");
                        setAge("");
                        setGender("");
                      }}
                    >
                      New Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar remains unchanged */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthCheck;
