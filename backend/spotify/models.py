from django.db import models

# Create your models here.
class SpotifyToken(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.CharField(max_length=500)
    access_token = models.CharField(max_length=500)
    expires_in = models.DateTimeField()
    token_type = models.CharField(max_length=100)

class LyricAnalysis(models.Model):
    """Store lyric emotion analysis results"""
    track_id = models.CharField(max_length=100, unique=True)
    track_name = models.CharField(max_length=200, blank=True)
    artist_name = models.CharField(max_length=200, blank=True)
    lyrics = models.TextField()
    emotions = models.JSONField()  # Store emotion predictions as JSON
    confidence_score = models.FloatField()
    analyzed_at = models.DateTimeField(auto_now_add=True)
    model_version = models.CharField(max_length=50, default="v1.0")
    
    class Meta:
        db_table = 'lyric_analysis'
    
    def __str__(self):
        return f"Analysis for {self.track_name} by {self.artist_name}"

class EmotionFeedback(models.Model):
    """Store user feedback for model improvement"""
    analysis = models.ForeignKey(LyricAnalysis, on_delete=models.CASCADE)
    user_emotions = models.JSONField()  # User-corrected emotions
    feedback_type = models.CharField(max_length=20, choices=[
        ('correction', 'Correction'),
        ('validation', 'Validation'),
        ('additional', 'Additional Emotion')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'emotion_feedback'
    
    def __str__(self):
        return f"Feedback for {self.analysis.track_name}"