import torch
import torch.nn as nn
from transformers import DistilBertModel, DistilBertTokenizer
from typing import Dict, List

class LyricEmotionClassifier(nn.Module):
    """Custom transformer-based emotion classifier for song lyrics"""
    
    def __init__(self, num_emotions: int = 8, model_name: str = "distilbert-base-uncased"):
        super().__init__()
        self.num_emotions = num_emotions
        self.model_name = model_name
        
        # Emotion labels
        self.emotion_labels = [
            "joy", "sadness", "anger", "fear", 
            "love", "nostalgia", "hope", "melancholy"
        ]
        
        # Load pre-trained DistilBERT
        self.bert = DistilBertModel.from_pretrained(model_name)
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        
        # Classification head
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_emotions)
        
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0]  # [CLS] token
        
        output = self.dropout(pooled_output)
        logits = self.classifier(output)
        
        return logits
    
    def predict_emotions(self, lyrics: str, threshold: float = 0.5) -> Dict[str, float]:
        """Predict emotions for given lyrics"""
        self.eval()
        
        # Tokenize input
        encoded = self.tokenizer(
            lyrics,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        with torch.no_grad():
            logits = self.forward(
                encoded['input_ids'],
                encoded['attention_mask']
            )
            
            # Apply sigmoid for multi-label classification
            probabilities = torch.sigmoid(logits).squeeze()
            
        # Convert to dictionary
        emotions = {}
        for i, emotion in enumerate(self.emotion_labels):
            prob = probabilities[i].item()
            if prob >= threshold:
                emotions[emotion] = prob
                
        return emotions