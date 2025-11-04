'use client';

interface UserGoals {
  type: 'slim-fit' | 'muscle-gain' | 'fat-loss' | 'maintenance';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

interface GoalSelectionProps {
  goals: Record<string, UserGoals>;
  selectedGoal: string;
  onGoalSelect: (goal: string) => void;
}

export default function GoalSelection({ goals, selectedGoal, onGoalSelect }: GoalSelectionProps) {
  const getGoalIcon = (key: string) => {
    switch (key) {
      case 'slim-fit': return '🏃‍♀️';
      case 'muscle-gain': return '💪';
      case 'fat-loss': return '🔥';
      default: return '⚖️';
    }
  };

  const getGoalDisplayName = (key: string) => {
    return key.replace('-', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Goal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(goals).map(([key, goal]) => (
          <button
            key={key}
            onClick={() => onGoalSelect(key)}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedGoal === key
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{getGoalIcon(key)}</span>
              <h3 className="font-bold text-lg">{getGoalDisplayName(key)}</h3>
            </div>
            {/* <p className="text-sm text-gray-600 mb-2">
              Target: {goal.targetCalories} kcal, {goal.targetProtein}g protein
            </p> */}
          </button>
        ))}
      </div>
    </div>
  );
}

