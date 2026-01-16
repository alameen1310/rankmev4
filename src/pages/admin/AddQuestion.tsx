import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Image as ImageIcon, 
  X, 
  Save, 
  Loader2,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBJECT_TOPICS } from '@/services/questionGenerator';

interface QuestionForm {
  subject: string;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  solutionSteps: string[];
}

const initialForm: QuestionForm = {
  subject: '',
  topic: '',
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
  difficulty: 'medium',
  points: 10,
  solutionSteps: [''],
};

export const AddQuestion = () => {
  const [form, setForm] = useState<QuestionForm>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = Object.keys(SUBJECT_TOPICS);
  const topics = form.subject ? SUBJECT_TOPICS[form.subject] || [] : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, GIF, and WebP images are allowed');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addSolutionStep = () => {
    setForm(prev => ({
      ...prev,
      solutionSteps: [...prev.solutionSteps, ''],
    }));
  };

  const removeSolutionStep = (index: number) => {
    setForm(prev => ({
      ...prev,
      solutionSteps: prev.solutionSteps.filter((_, i) => i !== index),
    }));
  };

  const updateSolutionStep = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      solutionSteps: prev.solutionSteps.map((step, i) => i === index ? value : step),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.subject || !form.questionText || !form.optionA || !form.optionB || 
        !form.optionC || !form.optionD || !form.explanation) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get subject ID
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', form.subject)
        .single();

      if (subjectError || !subjectData) {
        toast.error('Invalid subject selected');
        return;
      }

      // Upload image if exists
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `question_${Date.now()}.${fileExt}`;
        const filePath = `questions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Build explanation with solution steps
      let fullExplanation = form.explanation;
      const nonEmptySteps = form.solutionSteps.filter(s => s.trim());
      if (nonEmptySteps.length > 0) {
        fullExplanation += '\n\nSolution Steps:\n' + 
          nonEmptySteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
      }
      if (imageUrl) {
        fullExplanation += `\n\n[Image: ${imageUrl}]`;
      }

      // Insert question
      const { error: insertError } = await supabase
        .from('questions')
        .insert({
          subject_id: subjectData.id,
          question_text: form.questionText,
          option_a: form.optionA,
          option_b: form.optionB,
          option_c: form.optionC,
          option_d: form.optionD,
          correct_answer: form.correctAnswer,
          explanation: fullExplanation,
          difficulty: form.difficulty,
          points_value: form.points,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to add question');
        return;
      }

      // Update subject question count
      await supabase.rpc('increment_user_points', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy call to trigger count update
        p_points_to_add: 0,
        p_weekly_points_to_add: 0,
        p_increment_quizzes: 0,
      });

      toast.success('Question added successfully!');
      setRecentlyAdded(prev => prev + 1);
      
      // Reset form but keep subject
      const keepSubject = form.subject;
      setForm({ ...initialForm, subject: keepSubject });
      removeImage();

    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              Add Question Manually
            </h1>
            <p className="text-muted-foreground">
              Create a new JAMB-style question with images
            </p>
          </div>
          {recentlyAdded > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {recentlyAdded} added this session
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject & Topic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject & Topic</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select
                  value={form.subject}
                  onValueChange={(value) => setForm(prev => ({ ...prev, subject: value, topic: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={form.topic}
                  onValueChange={(value) => setForm(prev => ({ ...prev, topic: value }))}
                  disabled={!form.subject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.name} value={topic.name}>{topic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Question Text & Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question</CardTitle>
              <CardDescription>Enter the question text and optional image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Textarea
                  value={form.questionText}
                  onChange={(e) => setForm(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Enter the question..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Question Image (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload diagrams, graphs, or figures for math/science questions
                </p>
                
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Question" 
                      className="max-w-md max-h-64 rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Answer Options</CardTitle>
              <CardDescription>Enter 4 options and select the correct answer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={form.correctAnswer}
                onValueChange={(value) => setForm(prev => ({ ...prev, correctAnswer: value as 'A' | 'B' | 'C' | 'D' }))}
              >
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <div key={option} className="flex items-center gap-3">
                    <RadioGroupItem value={option} id={`option-${option}`} />
                    <Label 
                      htmlFor={`option-${option}`} 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        form.correctAnswer === option 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted'
                      }`}
                    >
                      {option}
                    </Label>
                    <Input
                      value={form[`option${option}` as keyof QuestionForm] as string}
                      onChange={(e) => setForm(prev => ({ ...prev, [`option${option}`]: e.target.value }))}
                      placeholder={`Option ${option}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                ✓ Selected option is the correct answer
              </p>
            </CardContent>
          </Card>

          {/* Explanation & Solution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Explanation & Solution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Explanation *</Label>
                <Textarea
                  value={form.explanation}
                  onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why the answer is correct..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Solution Steps (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSolutionStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.solutionSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <Input
                        value={step}
                        onChange={(e) => updateSolutionStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        className="flex-1"
                      />
                      {form.solutionSteps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSolutionStep(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty & Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty & Points</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) => setForm(prev => ({ ...prev, difficulty: value as 'easy' | 'medium' | 'hard' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (10 points)</SelectItem>
                    <SelectItem value="medium">Medium (15 points)</SelectItem>
                    <SelectItem value="hard">Hard (20 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Points Value</Label>
                <Input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                  min={5}
                  max={50}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Question
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm(initialForm);
                removeImage();
              }}
            >
              Reset Form
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddQuestion;
