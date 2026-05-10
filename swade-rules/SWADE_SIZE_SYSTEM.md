# SWADE Size System Implementation

## Overview

Полная реализация системы размеров SWADE согласно правилам на стр. 246 основной книги.

## Size Range

**Диапазон**: от -4 (очень маленькие создания) до 20+ (громадные чудища)

### Силуэты (Silhouettes)

| Модификатор | Силуэт | Примеры |
|-------------|--------|---------|
| -6 | Крошечный (Tiny) | Фея, пикси |
| -4 | Очень мелкий (Very Small) | Орёл, кошка |
| -2 | Мелкий (Small) | Собака, ребёнок |
| 0 | Средний (Normal) | Человек, эльф |
| +2 | Большой (Large) | Лошадь, огр |
| +4 | Огромный (Huge) | Слон, великан |
| +6+ | Гигантский (Gigantic) | Дракон, кит, титаны |

## Size Effects

### 1. Модификатор к Стойкости
Размер напрямую добавляется к Стойкости существа.

**Пример**: 
- Крошечная фея (-6): Стойкость = 2 + Vigor/2 - 6
- Огромный дракон (+4): Стойкость = 2 + Vigor/2 + 4

### 2. Модификатор атаки между разными размерами

**Правило**: В бою между существами с разными силуэтами:
- **Меньшее существо** добавляет разницу модификаторов силуэтов к результату атаки
- **Большее существо** вычитает разницу из результата атаки

**Примеры**:
```java
// Крошечная фея (-6) атакует огромного дракона (+4)
// Разница силуэтов: 10
// Фея добавляет +10 к атаке
int modifier = SizeUtils.getSizeAttackModifier(-6, 4); // returns +10

// Огромный дракон (+4) атакует крошечную фею (-6)
// Дракон вычитает 10 из атаки
int modifier = SizeUtils.getSizeAttackModifier(4, -6); // returns -10

// Очень мелкий орёл (-4) атакует крошечную фею (-6)
// Орёл больше, вычитает 2
int modifier = SizeUtils.getSizeAttackModifier(-4, -6); // returns -2
```

### 3. Дополнительные ранения

Крупные существа могут перенести больше ранений:

| Силуэт | Бонус | Макс. ранения |
|--------|-------|---------------|
| Большой (+2) | +1 | 4 (вместо 3) |
| Огромный (+4) | +2 | 5 (вместо 3) |
| Гигантский (+6+) | +3 | 6 (вместо 3) |

**Примечание**: Максимальный штраф за ранения остаётся −3. Это также складывается с дополнительными ранениями от Живучий/Очень живучий.

```java
// Проверить максимальное количество ранений
int maxWounds = SizeUtils.getMaxWounds(size);

// Средний человек (0): 3
// Большая лошадь (+2): 4
// Огромный слон (+4): 5
// Гигантский дракон (+6): 6
```

### 4. Увеличенная дальность ближнего боя

У больших существ дальность атак ближнего боя возрастает на количество дюймов, равное количеству дополнительных ранений.

```java
int reach = SizeUtils.getMeleeReachBonus(size);

// Средний (0): 0 дюймов (стандартная дальность)
// Большой (+2): +1 дюйм
// Огромный (+4): +2 дюйма
// Гигантский (+6): +3 дюйма
```

## Implementation

### Backend

#### Database
```sql
-- Migration V8: Expanded size range
ALTER TABLE swade.characters
ADD CONSTRAINT characters_size_check CHECK (size >= -4 AND size <= 20);
```

#### Model
```java
// Character.java
private int size; // SWADE Size modifier (-4 to 20+)
```

#### Utility Class
```java
// SizeUtils.java - Comprehensive size calculations
SizeUtils.getBonusWounds(size)          // Additional wounds
SizeUtils.getMaxWounds(size)            // Maximum wounds
SizeUtils.getSizeAttackModifier(a, d)   // Attack modifier in combat
SizeUtils.getSilhouetteModifier(size)   // Silhouette category
SizeUtils.getMeleeReachBonus(size)      // Reach bonus
SizeUtils.getSilhouetteName(size)       // Display name
```

### Frontend

#### AddCharacterModal Size Selector
```tsx
<select value={size} onChange={(e) => setSize(Number(e.target.value))}>
  <optgroup label="Крошечные/Очень мелкие">
    <option value="-6">-6 (Крошечный - фея, пикси)</option>
    <option value="-4">-4 (Очень мелкий - орёл, кошка)</option>
  </optgroup>
  <optgroup label="Мелкие/Средние">
    <option value="-2">-2 (Мелкий - собака, ребёнок)</option>
    <option value="0">0 (Средний - человек, эльф)</option>
  </optgroup>
  <optgroup label="Большие">
    <option value="2">+2 (Большой - лошадь, огр)</option>
  </optgroup>
  <optgroup label="Огромные">
    <option value="4">+4 (Огромный - слон, великан)</option>
  </optgroup>
  <optgroup label="Гигантские">
    <option value="6">+6 (Гигантский - дракон)</option>
    <option value="10">+10 (Колоссальный)</option>
    <option value="20">+20 (Легендарный)</option>
  </optgroup>
</select>
```

#### Size Effects Display
```tsx
<div className="rounded bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
  <p className="font-semibold">💡 Эффекты размера:</p>
  <ul>
    <li>Модификатор к Стойкости</li>
    <li>В бою меньшее существо получает бонус к атаке</li>
    <li>Большие (+2): +1 ранение (макс. 4)</li>
    <li>Огромные (+4): +2 ранения (макс. 5)</li>
    <li>Гигантские (+6+): +3 ранения (макс. 6)</li>
  </ul>
</div>
```

## Testing

### Unit Tests (SizeUtilsTest.java)
- ✅ Bonus wounds calculation
- ✅ Max wounds calculation
- ✅ Attack modifier for different size combinations
- ✅ Silhouette mapping
- ✅ Melee reach bonus
- ✅ Size validation
- ✅ Real-world scenarios (fairy vs dragon, horse vs human, etc.)

### Integration Tests
- ✅ Create character with various sizes (-6 to +20)
- ✅ Size persisted to database
- ✅ Size returned in API responses

## Usage Examples

### Example 1: Fairy vs Dragon Combat
```java
// Крошечная фея атакует огромного дракона
int fairySize = -6;
int dragonSize = 4;

// Фея получает +10 к атаке
int attackBonus = SizeUtils.getSizeAttackModifier(fairySize, dragonSize);
// Result: +10

// Дракон имеет +2 бонусных ранения
int dragonMaxWounds = SizeUtils.getMaxWounds(dragonSize);
// Result: 5 (base 3 + 2 bonus)

// Дракон имеет +2 дюйма дальности ближнего боя
int dragonReach = SizeUtils.getMeleeReachBonus(dragonSize);
// Result: 2
```

### Example 2: Horse vs Human
```java
int horseSize = 2;  // Большая лошадь
int humanSize = 0;  // Средний человек

// Человек атакует лошадь - получает +2
int humanAttackBonus = SizeUtils.getSizeAttackModifier(humanSize, horseSize);
// Result: +2

// Лошадь атакует человека - получает -2
int horseAttackPenalty = SizeUtils.getSizeAttackModifier(horseSize, humanSize);
// Result: -2

// Лошадь может перенести 4 ранения (вместо 3)
int horseMaxWounds = SizeUtils.getMaxWounds(horseSize);
// Result: 4

// У лошади дальность ближнего боя +1 дюйм
int horseReach = SizeUtils.getMeleeReachBonus(horseSize);
// Result: 1
```

## Migration Guide

### Применение миграции
```bash
cd server
mvn flyway:migrate
```

### Проверка изменений
```sql
-- Check constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'swade.characters'::regclass 
AND conname = 'characters_size_check';

-- Should show: CHECK (size >= -4 AND size <= 20)
```

## Future Enhancements

1. **Auto-calculate in Combat**: Automatically apply size modifiers during attack resolution
2. **Wound Tracking**: UI displays max wounds based on size (e.g., "2/4" for Large creature)
3. **Reach Visualization**: Show reach area on battle map for large creatures
4. **Size-based Movement**: Larger creatures may have movement restrictions
5. **Equipment Scaling**: Weapons/armor costs and weight scale with size

## References

- SWADE Core Rules, стр. 148: "Размер и силуэт"
- SWADE Core Rules, стр. 246: "Таблица размеров"
- SizeUtils.java: Utility class implementation
- SizeUtilsTest.java: Comprehensive test suite
