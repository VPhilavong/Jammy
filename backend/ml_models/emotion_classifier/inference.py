import torch
import os
from typing import Dict, List, Optional
from .model import LyricEmotionClassifier

class EmotionPredictor:
    """Inference wrapper for the emotion classification model"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load trained model from checkpoint"""
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            
            self.model = LyricEmotionClassifier(
                num_emotions=checkpoint.get('num_emotions', 8),
                model_name=checkpoint.get('model_name', 'distilbert-base-uncased')
            )
            
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            print(f"Model loaded successfully from {model_path}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def predict(self, lyrics: str, threshold: float = 0.5) -> Dict[str, float]:
        """Predict emotions for song lyrics"""
        if not self.model:
            # For now, return a dummy prediction if no model is loaded
            print("Warning: No trained model loaded. Using dummy predictions.")
            return {"joy": 0.3, "sadness": 0.1}
        
        return self.model.predict_emotions(lyrics, threshold)
    
    def batch_predict(self, lyrics_list: List[str], threshold: float = 0.5) -> List[Dict[str, float]]:
        """Predict emotions for multiple lyrics"""
        return [self.predict(lyrics, threshold) for lyrics in lyrics_list]
    
    def is_model_loaded(self) -> bool:
        """Check if a model is currently loaded"""
        return self.model is not None
    
    def get_emotion_labels(self) -> List[str]:
        """Get list of emotion labels"""
        if self.model:
            return self.model.emotion_labels
        else:
            return ["joy", "sadness", "anger", "fear", "love", "nostalgia", "hope", "melancholy"]