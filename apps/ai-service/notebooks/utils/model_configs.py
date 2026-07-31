from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb
import lightgbm as lgb

def get_baseline_classifiers():
    """Get baseline classification models"""
    return {
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            random_state=42,
            n_jobs=-1
        ),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=10,
            random_state=42
        )
    }

def get_advanced_classifiers():
    """Get advanced classification models"""
    return {
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

def get_baseline_regressors():
    """Get baseline regression models"""
    return {
        'Linear Regression': LinearRegression(),
        'Ridge Regression': Ridge(alpha=1.0, random_state=42),
        'Lasso Regression': Lasso(alpha=1.0, random_state=42, max_iter=5000)
    }

def get_advanced_regressors():
    """Get advanced regression models"""
    return {
        'Random Forest': RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        ),
        'XGBoost': xgb.XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42,
            n_jobs=-1
        ),
        'LightGBM': lgb.LGBMRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        )
    }

def get_classifier_param_grid(model_name: str):
    """Get hyperparameter grid for classifier tuning"""
    grids = {
        'Random Forest': {
            'n_estimators': [100, 200],
            'max_depth': [15, 20, 25],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        },
        'XGBoost': {
            'n_estimators': [100, 200],
            'max_depth': [5, 6, 7],
            'learning_rate': [0.05, 0.1, 0.15],
            'subsample': [0.8, 1.0]
        },
        'LightGBM': {
            'n_estimators': [100, 200],
            'max_depth': [5, 6, 7],
            'learning_rate': [0.05, 0.1, 0.15],
            'num_leaves': [31, 50]
        },
        'Gradient Boosting': {
            'n_estimators': [100, 200],
            'learning_rate': [0.05, 0.1, 0.15],
            'max_depth': [4, 5, 6]
        }
    }
    return grids.get(model_name, {})

def get_regressor_param_grid(model_name: str):
    """Get hyperparameter grid for regressor tuning"""
    return get_classifier_param_grid(model_name)  # Same grids work for both

def get_base_model_for_tuning(model_name: str, is_classifier: bool = True):
    """Get base model instance for hyperparameter tuning"""
    if is_classifier:
        models = get_advanced_classifiers()
    else:
        models = get_advanced_regressors()
    
    # Return a fresh instance with minimal config
    if model_name == 'Random Forest':
        return RandomForestClassifier(random_state=42, n_jobs=-1) if is_classifier else \
               RandomForestRegressor(random_state=42, n_jobs=-1)
    elif model_name == 'XGBoost':
        return xgb.XGBClassifier(random_state=42, n_jobs=-1, eval_metric='mlogloss') if is_classifier else \
               xgb.XGBRegressor(random_state=42, n_jobs=-1)
    elif model_name == 'LightGBM':
        return lgb.LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1) if is_classifier else \
               lgb.LGBMRegressor(random_state=42, n_jobs=-1, verbose=-1)
    else:  # Gradient Boosting
        return GradientBoostingClassifier(random_state=42) if is_classifier else \
               GradientBoostingRegressor(random_state=42)
