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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HealthCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleAnalyze = async () => {
    // Validation
    if (!symptoms.trim()) {
      toast({
        title: "Please describe your symptoms",
        description: "Enter your symptoms to get AI health guidance",
        variant: "destructive",
      });
      return;
    }

    if (!age.trim() || !gender.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your age and gender",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis - replace with actual backend call later
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: reportFile
          ? `Uploaded report: ${reportFile.name}`
          : "Connect to Supabase to enable full AI health analysis",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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
              for farmers
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Tell us about your symptoms
                  </CardTitle>
                  <CardDescription>
                    Describe how you're feeling using simple, everyday language.
                    Include when symptoms started and how severe they are.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        onValueChange={(value) => setGender(value)}
                        value={gender}
                      >
                        <SelectTrigger id="gender">
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

                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Describe your symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Example: I have been feeling tired and weak for 3 days. I also have a headache and my stomach hurts after eating..."
                      className="min-h-[120px]"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>

                  {/* 📎 Report Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="report">
                      Upload Medical Report (optional)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="report"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                      <FileUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {reportFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploaded:{" "}
                        <span className="font-medium">{reportFile.name}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-glow"
                    size="lg"
                  >
                    {isAnalyzing
                      ? "Analyzing symptoms..."
                      : "Get AI Health Guidance"}
                  </Button>
                </CardContent>
              </Card>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Analysis Results */}
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
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {analysisResult.analysis}
                      </div>
                    </div>
                    
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Health Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Stay hydrated, especially during farming work
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Wear protective gear when handling chemicals
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Take regular breaks during long work hours
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Warning */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Warning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700">
                    If you have severe chest pain, difficulty breathing, or
                    other emergency symptoms, seek immediate medical attention.
                  </p>
                </CardContent>
              </Card>

              {/* Common Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Common Farmer Health Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Back Pain</Badge>
                    <Badge variant="secondary">Heat Stress</Badge>
                    <Badge variant="secondary">Skin Issues</Badge>
                    <Badge variant="secondary">Respiratory</Badge>
                    <Badge variant="secondary">Joint Pain</Badge>
                    <Badge variant="secondary">Eye Strain</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthCheck;
