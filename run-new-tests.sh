#!/bin/bash

echo "🧪 Running New Test Suite"
echo "========================="

echo ""
echo "📊 Battle Engine Tests"
echo "----------------------"
npm test -- --testPathPatterns="battle-engine-detailed" --verbose

echo ""
echo "⚔️  Battle System Tests"
echo "----------------------"
npm test -- --testPathPatterns="battle-system" --verbose

echo ""
echo "👥 Team Creation Tests"
echo "----------------------"
npm test -- --testPathPatterns="team-creation" --verbose

echo ""
echo "✅ All new tests completed!"
