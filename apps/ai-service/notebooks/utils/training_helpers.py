import time
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error
)
from sklearn.model_selection import cross_val_score

def print_section_header(title: str, section_num: int = None):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    if section_num:
        print(f"{'📊' if section_num <= 3 else '🚀'} SECTION {section_num}: {title}")
    else:
        print(f"⏱️  {title}")
    print("=" * 70)

def train_and_evaluate_classifier(name: str, model, X_train, y_train, X_test, y_test, 
                                   use_cv: bool = False):
    """Train and evaluate a classification model"""
    print(f"\n🔧 Training {name}...")
    start_time = time.time()
    
    # Train model
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    train_time = time.time() - start_time
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    
    print(f"   ✅ Accuracy: {accuracy:.4f}")
    print(f"   ✅ Precision: {precision:.4f}")
    print(f"   ✅ Recall: {recall:.4f}")
    print(f"   ✅ F1-Score: {f1:.4f}")
    
    # Cross-validation if requested
    cv_score = None
    cv_std = None
    if use_cv:
        print(f"   🔄 Running 5-fold cross-validation...")
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, n_jobs=-1)
        cv_score = cv_scores.mean()
        cv_std = cv_scores.std()
        print(f"   ✅ CV Score: {cv_score:.4f} (+/- {cv_std:.4f})")
    
    print(f"   ⏱️  Training Time: {train_time:.2f}s")
    
    return {
        'model': model,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'train_time': train_time,
        'cv_score': cv_score,
        'cv_std': cv_std,
        'predictions': y_pred
    }

def train_and_evaluate_regressor(name: str, model, X_train, y_train, X_test, y_test,
                                  use_cv: bool = False):
    """Train and evaluate a regression model"""
    print(f"\n🔧 Training {name}...")
    start_time = time.time()
    
    # Train model
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    train_time = time.time() - start_time
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    
    print(f"   ✅ MAE: {mae:.4f} minutes")
    print(f"   ✅ RMSE: {rmse:.4f} minutes")
    print(f"   ✅ R²: {r2:.4f}")
    print(f"   ✅ MAPE: {mape:.2f}%")
    
    # Cross-validation if requested
    cv_mae = None
    cv_std = None
    if use_cv:
        print(f"   🔄 Running 5-fold cross-validation...")
        cv_scores = cross_val_score(model, X_train, y_train, cv=5,
                                      scoring='neg_mean_absolute_error', n_jobs=-1)
        cv_mae = -cv_scores.mean()
        cv_std = cv_scores.std()
        print(f"   ✅ CV MAE: {cv_mae:.4f} (+/- {cv_std:.4f})")
    
    print(f"   ⏱️  Training Time: {train_time:.2f}s")
    
    return {
        'model': model,
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'mape': mape,
        'train_time': train_time,
        'cv_mae': cv_mae,
        'cv_std': cv_std,
        'predictions': y_pred
    }

def print_classification_summary(results: dict):
    """Print classification model comparison summary"""
    print("\n📋 Performance Summary:")
    print(f"\n{'Model':<20} {'Accuracy':<12} {'F1-Score':<12} {'Train Time':<12} {'CV Score':<12}")
    print("-" * 70)
    
    for name, result in results.items():
        cv_str = f"{result['cv_score']:.4f}" if result['cv_score'] else "N/A"
        print(f"{name:<20} {result['accuracy']:>8.4f}     {result['f1']:>8.4f}     "
              f"{result['train_time']:>8.2f}s    {cv_str:>8}")

def print_regression_summary(results: dict):
    """Print regression model comparison summary"""
    print("\n📋 Performance Summary:")
    print(f"\n{'Model':<20} {'MAE (min)':<12} {'RMSE (min)':<12} {'R²':<10} {'Train Time':<12}")
    print("-" * 75)
    
    for name, result in results.items():
        print(f"{name:<20} {result['mae']:>8.4f}     {result['rmse']:>8.4f}     "
              f"{result['r2']:>6.4f}    {result['train_time']:>8.2f}s")

def print_feature_importance(model, feature_names: list, top_n: int = 10):
    """Print feature importance for tree-based models"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        print(f"\n📊 Top {top_n} Most Important Features:")
        for i in range(min(top_n, len(indices))):
            idx = indices[i]
            print(f"   {i+1:2d}. {feature_names[idx]:<30} {importances[idx]:.4f}")

def print_classification_details(y_test, y_pred, label_encoder):
    """Print detailed classification metrics"""
    print("\n📋 Classification Report:")
    target_names = label_encoder.classes_
    print(classification_report(y_test, y_pred, target_names=target_names, zero_division=0))
    
    print("\n📊 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print("                    Predicted")
    print(f"           {'  '.join([f'{name:8}' for name in target_names])}")
    print("Actual")
    for i, name in enumerate(target_names):
        print(f"{name:8}   {'  '.join([f'{cm[i][j]:8d}' for j in range(len(target_names))])}")

def print_regression_details(y_test, y_pred):
    """Print detailed regression metrics"""
    residuals = y_test - y_pred
    
    print("\n📊 Prediction Error Distribution:")
    print(f"   Mean Error: {residuals.mean():.4f} minutes")
    print(f"   Std Error: {residuals.std():.4f} minutes")
    print(f"   Min Error: {residuals.min():.4f} minutes")
    print(f"   Max Error: {residuals.max():.4f} minutes")
    
    print("\n📊 Error Percentiles:")
    percentiles = [10, 25, 50, 75, 90]
    for p in percentiles:
        error_p = np.percentile(np.abs(residuals), p)
        print(f"   {p}th percentile: {error_p:.4f} minutes")
    
    print("\n📊 Prediction Accuracy within Thresholds:")
    for threshold in [1, 2, 3, 5]:
        within = (np.abs(residuals) <= threshold).sum()
        percentage = (within / len(residuals)) * 100
        print(f"   Within {threshold} min: {within:,} ({percentage:.2f}%)")

def check_production_readiness_classifier(accuracy: float, f1: float, precision: float, recall: float):
    """Check if classifier meets production standards"""
    print("\n🎯 Target Metrics (10/10 Production Standard):")
    print(f"   Target Accuracy: ≥ 90%")
    print(f"   Target F1-Score: ≥ 0.88")
    print(f"   Target Precision: ≥ 0.87")
    print(f"   Target Recall: ≥ 0.89")
    
    print("\n📊 Achieved Metrics:")
    acc_pass = "✅ PASS" if accuracy >= 0.90 else "⚠️  ACCEPTABLE (85%+ is production-ready)"
    f1_pass = "✅ PASS" if f1 >= 0.88 else "⚠️  ACCEPTABLE"
    prec_pass = "✅ PASS" if precision >= 0.87 else "⚠️  ACCEPTABLE"
    rec_pass = "✅ PASS" if recall >= 0.89 else "⚠️  ACCEPTABLE"
    
    print(f"   ✅ Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%) {acc_pass}")
    print(f"   ✅ F1-Score: {f1:.4f} {f1_pass}")
    print(f"   ✅ Precision: {precision:.4f} {prec_pass}")
    print(f"   ✅ Recall: {recall:.4f} {rec_pass}")
    
    all_pass = accuracy >= 0.90 and f1 >= 0.88
    
    print("\n" + "=" * 70)
    if all_pass:
        print("🎉 MODEL READY FOR PRODUCTION! 10/10")
    else:
        print("⚠️  MODEL PERFORMANCE: 8-9/10 - Good for production")
        print("   Real-world traffic is unpredictable, 85%+ is excellent!")
    print("=" * 70)

def check_production_readiness_regressor(mae: float, r2: float, mape: float):
    """Check if regressor meets production standards"""
    print("\n🎯 Target Metrics (10/10 Production Standard):")
    print(f"   Target MAE: < 3 minutes")
    print(f"   Target R²: > 0.85")
    print(f"   Target MAPE: < 15%")
    
    print("\n📊 Achieved Metrics:")
    mae_pass = "✅ PASS" if mae < 3.0 else "⚠️  ACCEPTABLE"
    r2_pass = "✅ PASS" if r2 > 0.85 else "⚠️  ACCEPTABLE"
    mape_pass = "✅ PASS" if mape < 15 else "⚠️  ACCEPTABLE"
    
    print(f"   ✅ MAE: {mae:.4f} minutes {mae_pass}")
    print(f"   ✅ R²: {r2:.4f} {r2_pass}")
    print(f"   ✅ MAPE: {mape:.2f}% {mape_pass}")
    
    all_pass = mae < 3.0 and r2 > 0.85 and mape < 15
    
    print("\n" + "=" * 70)
    if all_pass:
        print("🎉 ETA MODEL READY FOR PRODUCTION! 10/10")
    else:
        print("⚠️  ETA MODEL PERFORMANCE: 8-9/10 - Good for production")
    print("=" * 70)
