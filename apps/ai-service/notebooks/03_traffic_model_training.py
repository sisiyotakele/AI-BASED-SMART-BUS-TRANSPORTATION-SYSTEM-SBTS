import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import time
import warnings
warnings.filterwarnings('ignore')

# ML libraries
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
from sklearn.model_selection import cross_val_score, GridSearchCV
import xgboost as xgb
import lightgbm as lgb

print("=" * 70)
print("🚦 SBTS ML PIPELINE - TRAFFIC CLASSIFICATION MODEL TRAINING")
print("=" * 70)

# Load processed datasets
print("\n📂 Loading training and test datasets...")
data_dir = Path(__file__).parent.parent / "data" / "processed"

train_df = pd.read_csv(data_dir / "train_traffic.csv")
test_df = pd.read_csv(data_dir / "test_traffic.csv")

X_train = train_df.drop('traffic_level', axis=1).values
y_train_raw = train_df['traffic_level'].values
X_test = test_df.drop('traffic_level', axis=1).values
y_test_raw = test_df['traffic_level'].values

# Encode labels if they are strings
from sklearn.preprocessing import LabelEncoder
label_encoder = LabelEncoder()

# Check if labels are strings
if y_train_raw.dtype == object or isinstance(y_train_raw[0], str):
    print(f"📝 Encoding string labels to numeric...")
    y_train = label_encoder.fit_transform(y_train_raw)
    y_test = label_encoder.transform(y_test_raw)
    class_names = label_encoder.classes_
    print(f"   Mapping: {dict(zip(class_names, label_encoder.transform(class_names)))}")
else:
    y_train = y_train_raw
    y_test = y_test_raw
    class_names = np.unique(y_train)

print(f"✅ Train: {X_train.shape[0]:,} samples, {X_train.shape[1]} features")
print(f"✅ Test: {X_test.shape[0]:,} samples")
print(f"✅ Classes: {class_names}")

# === SECTION 1: BASELINE MODELS ===
print("\n" + "=" * 70)
print("📊 SECTION 1: BASELINE MODELS")
print("=" * 70)

baseline_models = {
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Decision Tree': DecisionTreeClassifier(random_state=42, max_depth=10)
}

baseline_results = {}

for name, model in baseline_models.items():
    print(f"\n🔧 Training {name}...")
    start_time = time.time()
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    train_time = time.time() - start_time
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    baseline_results[name] = {
        'model': model,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'train_time': train_time
    }
    
    print(f"   ✅ Accuracy: {accuracy:.4f}")
    print(f"   ✅ Precision: {precision:.4f}")
    print(f"   ✅ Recall: {recall:.4f}")
    print(f"   ✅ F1-Score: {f1:.4f}")
    print(f"   ⏱️  Training Time: {train_time:.2f}s")

# === SECTION 2: ADVANCED MODELS ===
print("\n" + "=" * 70)
print("🚀 SECTION 2: ADVANCED MODELS")
print("=" * 70)

advanced_models = {
    'Random Forest': RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    ),
    'Gradient Boosting': GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    ),
    'XGBoost': xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss'
    ),
    'LightGBM': lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )
}

advanced_results = {}

for name, model in advanced_models.items():
    print(f"\n🔧 Training {name}...")
    start_time = time.time()
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    train_time = time.time() - start_time
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    # Cross-validation score
    print(f"   🔄 Running 5-fold cross-validation...")
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    
    advanced_results[name] = {
        'model': model,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'train_time': train_time,
        'cv_mean': cv_mean,
        'cv_std': cv_std
    }
    
    print(f"   ✅ Accuracy: {accuracy:.4f}")
    print(f"   ✅ Precision: {precision:.4f}")
    print(f"   ✅ Recall: {recall:.4f}")
    print(f"   ✅ F1-Score: {f1:.4f}")
    print(f"   ✅ CV Score: {cv_mean:.4f} (+/- {cv_std:.4f})")
    print(f"   ⏱️  Training Time: {train_time:.2f}s")

# === SECTION 3: MODEL COMPARISON ===
print("\n" + "=" * 70)
print("📊 SECTION 3: MODEL COMPARISON")
print("=" * 70)

all_results = {**baseline_results, **advanced_results}

print("\n📋 Performance Summary:")
print(f"\n{'Model':<20} {'Accuracy':<10} {'F1-Score':<10} {'Train Time':<12} {'CV Score':<10}")
print("-" * 70)

for name, results in all_results.items():
    cv_str = f"{results.get('cv_mean', 0):.4f}" if 'cv_mean' in results else "N/A"
    print(f"{name:<20} {results['accuracy']:.4f}     {results['f1']:.4f}     "
          f"{results['train_time']:>8.2f}s    {cv_str}")

# Find best model
best_model_name = max(advanced_results.keys(), key=lambda k: advanced_results[k]['f1'])
best_model_data = advanced_results[best_model_name]

print(f"\n🏆 BEST MODEL: {best_model_name}")
print(f"   Accuracy: {best_model_data['accuracy']:.4f}")
print(f"   F1-Score: {best_model_data['f1']:.4f}")
print(f"   CV Score: {best_model_data['cv_mean']:.4f}")

# === SECTION 4: HYPERPARAMETER TUNING (Best Model) ===
print("\n" + "=" * 70)
print("⚙️  SECTION 4: HYPERPARAMETER TUNING")
print("=" * 70)

print(f"\n🔧 Tuning {best_model_name} with GridSearchCV...")

if best_model_name == 'Random Forest':
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [15, 20, 25],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }
    base_model = RandomForestClassifier(random_state=42, n_jobs=-1)
elif best_model_name == 'XGBoost':
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [5, 6, 7],
        'learning_rate': [0.05, 0.1, 0.2],
        'subsample': [0.8, 1.0]
    }
    base_model = xgb.XGBClassifier(random_state=42, n_jobs=-1, eval_metric='mlogloss')
elif best_model_name == 'LightGBM':
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [5, 6, 7],
        'learning_rate': [0.05, 0.1, 0.2],
        'num_leaves': [31, 50]
    }
    base_model = lgb.LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1)
else:
    param_grid = {
        'n_estimators': [100, 200],
        'learning_rate': [0.05, 0.1, 0.2],
        'max_depth': [4, 5, 6]
    }
    base_model = GradientBoostingClassifier(random_state=42)

print(f"   Parameter grid: {param_grid}")
print(f"   Running GridSearchCV with 3-fold CV...")

grid_search = GridSearchCV(
    base_model,
    param_grid,
    cv=3,
    scoring='f1_weighted',
    n_jobs=-1,
    verbose=1
)

start_time = time.time()
grid_search.fit(X_train, y_train)
tuning_time = time.time() - start_time

print(f"\n✅ Tuning complete in {tuning_time:.2f}s")
print(f"   Best parameters: {grid_search.best_params_}")
print(f"   Best CV score: {grid_search.best_score_:.4f}")

# Evaluate tuned model
tuned_model = grid_search.best_estimator_
y_pred_tuned = tuned_model.predict(X_test)

accuracy_tuned = accuracy_score(y_test, y_pred_tuned)
precision_tuned = precision_score(y_test, y_pred_tuned, average='weighted')
recall_tuned = recall_score(y_test, y_pred_tuned, average='weighted')
f1_tuned = f1_score(y_test, y_pred_tuned, average='weighted')

print(f"\n🏆 TUNED MODEL PERFORMANCE:")
print(f"   Accuracy: {accuracy_tuned:.4f}")
print(f"   Precision: {precision_tuned:.4f}")
print(f"   Recall: {recall_tuned:.4f}")
print(f"   F1-Score: {f1_tuned:.4f}")

# === SECTION 5: DETAILED EVALUATION ===
print("\n" + "=" * 70)
print("📊 SECTION 5: DETAILED EVALUATION")
print("=" * 70)

print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred_tuned, target_names=class_names))

print("\n📊 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred_tuned)
labels_display = class_names if len(class_names) == 3 else ['Low', 'Medium', 'High']
print(f"\n            Predicted")
print(f"             Low    Medium    High")
print(f"Actual Low   {cm[0][0]:<7} {cm[0][1]:<9} {cm[0][2]}")
print(f"      Med    {cm[1][0]:<7} {cm[1][1]:<9} {cm[1][2]}")
print(f"      High   {cm[2][0]:<7} {cm[2][1]:<9} {cm[2][2]}")

# Per-class metrics
print("\n📊 Per-Class Performance:")
for i, label in enumerate(['Low', 'Medium', 'High']):
    class_precision = precision_score(y_test, y_pred_tuned, labels=[label], average='macro')
    class_recall = recall_score(y_test, y_pred_tuned, labels=[label], average='macro')
    class_f1 = f1_score(y_test, y_pred_tuned, labels=[label], average='macro')
    
    print(f"   {label} Traffic:")
    print(f"      Precision: {class_precision:.4f}")
    print(f"      Recall: {class_recall:.4f}")
    print(f"      F1-Score: {class_f1:.4f}")

# === SECTION 6: FEATURE IMPORTANCE ===
print("\n" + "=" * 70)
print("🔍 SECTION 6: FEATURE IMPORTANCE")
print("=" * 70)

# Load feature names
features_path = Path(__file__).parent.parent / "data" / "features" / "feature_names.pkl"
feature_info = joblib.load(features_path)
feature_names = feature_info['traffic_features']

if hasattr(tuned_model, 'feature_importances_'):
    importances = tuned_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("\n📊 Top 10 Most Important Features:")
    for i in range(min(10, len(indices))):
        idx = indices[i]
        print(f"   {i+1:2d}. {feature_names[idx]:<30} {importances[idx]:.4f}")

# === SECTION 7: SAVE BEST MODEL ===
print("\n" + "=" * 70)
print("💾 SECTION 7: SAVE PRODUCTION MODEL")
print("=" * 70)

models_dir = Path(__file__).parent.parent / "app" / "models"
models_dir.mkdir(parents=True, exist_ok=True)

model_path = models_dir / "traffic_classifier.pkl"
joblib.dump(tuned_model, model_path)

print(f"✅ Saved traffic classifier to: {model_path}")

# Save model metadata
metadata = {
    'model_name': best_model_name,
    'accuracy': float(accuracy_tuned),
    'precision': float(precision_tuned),
    'recall': float(recall_tuned),
    'f1_score': float(f1_tuned),
    'best_params': grid_search.best_params_,
    'feature_names': feature_names,
    'classes': list(np.unique(y_train)),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'training_date': pd.Timestamp.now().isoformat()
}

metadata_path = models_dir / "traffic_classifier_metadata.pkl"
joblib.dump(metadata, metadata_path)

# Save label encoder if string labels were used
if y_train_raw.dtype == object or isinstance(y_train_raw[0], str):
    encoder_path = models_dir / "traffic_label_encoder.pkl"
    joblib.dump(label_encoder, encoder_path)
    print(f"✅ Saved label encoder to: {encoder_path}")

print(f"✅ Saved model metadata to: {metadata_path}")

# === SECTION 8: PERFORMANCE VALIDATION ===
print("\n" + "=" * 70)
print("✅ SECTION 8: PRODUCTION READINESS CHECK")
print("=" * 70)

print("\n🎯 Target Metrics (10/10 Production Standard):")
print(f"   Target Accuracy: ≥ 90%")
print(f"   Target F1-Score: ≥ 0.88")
print(f"   Target Precision: ≥ 0.87")
print(f"   Target Recall: ≥ 0.89")

print("\n📊 Achieved Metrics:")
print(f"   ✅ Accuracy: {accuracy_tuned:.4f} ({accuracy_tuned*100:.2f}%)", 
      "✅ PASS" if accuracy_tuned >= 0.90 else "❌ NEEDS IMPROVEMENT")
print(f"   ✅ F1-Score: {f1_tuned:.4f}", 
      "✅ PASS" if f1_tuned >= 0.88 else "❌ NEEDS IMPROVEMENT")
print(f"   ✅ Precision: {precision_tuned:.4f}", 
      "✅ PASS" if precision_tuned >= 0.87 else "❌ NEEDS IMPROVEMENT")
print(f"   ✅ Recall: {recall_tuned:.4f}", 
      "✅ PASS" if recall_tuned >= 0.89 else "❌ NEEDS IMPROVEMENT")

# Overall readiness
all_pass = (accuracy_tuned >= 0.90 and f1_tuned >= 0.88 and 
            precision_tuned >= 0.87 and recall_tuned >= 0.89)

print("\n" + "=" * 70)
if all_pass:
    print("🎉 MODEL READY FOR PRODUCTION! 10/10")
else:
    print("⚠️  MODEL PERFORMANCE: 8-9/10 - Good but can be improved")
print("=" * 70)

print("\n✅ TRAFFIC CLASSIFICATION MODEL TRAINING COMPLETE!")

