# 5dChess

Euclidean 5d Chess 
- +++++

- +++++ 

vs 
Non-Euclidean(Curved) 5d Chess 

- ++++

vs 5d in Flat SpaceTime

- -+++++

vs 5d Chess in Interstellar(Curved SpaceTime)

- -+++++

# SpaceTime =!= Space + Time =!= Space-time

---

## 國際象棋遊戲（拓撲變體）

這是一個支持多種棋盤拓撲結構的國際象棋遊戲實現。

### 🎮 遊戲模式

#### 1. 標準模式 (Standard)
- 傳統的8×8棋盤
- 有邊界限制
- 經典國際象棋規則

#### 2. 環面模式 (Torus)
- 棋盤左右邊界相連接
- 棋盤上下邊界相連接
- 棋子可以從一邊穿越到另一邊
- 類似於吃豆人的環繞效果

#### 3. 克萊因瓶模式 (Klein Bottle)
- 類似環面模式的邊界連接
- **特殊規則：水平穿越邊界時，棋子顏色會翻轉！**
  - 白方棋子穿越左右邊界後變成黑方
  - 黑方棋子穿越左右邊界後變成白方
- 垂直穿越邊界不翻轉顏色
- 這體現了克萊因瓶的不定向性質（orientation = color）

### 🚀 如何遊玩

1. 在瀏覽器中打開 `index.html`
2. 選擇遊戲模式（標準/環面/克萊因瓶）
3. 觀察棋盤：**帶綠色發光邊框的棋子**表示可以移動
4. 點擊您想移動的棋子，綠色圓點顯示可移動位置
5. 點擊目標位置來移動棋子

### 🎨 視覺提示說明

- 🟩 **綠色發光邊框**：當前玩家可以移動的棋子
- 🟢 **綠色圓點**：選中棋子後，顯示可移動的位置
- 🔴 **紅色閃爍**：國王被將軍時閃爍
- 🟡 **黃色高亮**：當前選中的棋子

### 🎯 特色功能

- ✅ 完整的西洋棋規則
- ✅ 三種拓撲模式
- ✅ 將軍/將死檢測
- ✅ 兵升變
- ✅ 悔棋功能
- ✅ 被吃棋子顯示
- ✅ 響應式設計
- ✅ **智能高亮**：可移動的棋子會顯示綠色發光邊框

### 📐 拓撲學概念

**環面 (Torus)**：將矩形的對邊分別粘合而成的曲面。

**克萊因瓶 (Klein Bottle)**：一個不可定向的曲面，通過將矩形的一對對邊正常粘合，另一對對邊反向粘合而成。在我們的實現中，水平穿越會翻轉棋子顏色來模擬這種反向性質。

### ⚠️ 特殊規則說明

#### 環面和克萊因瓶模式的挑戰

在非歐幾里得拓撲結構中，傳統國際象棋的某些假設不再成立：

**問題：雙方國王同時被將軍**

在標準國際象棋中，這種情況是不可能發生的。但在環面和克萊因瓶模式中，由於：
1. **邊界環繞**：棋子可以從一邊出現在另一邊
2. **顏色翻轉**（Klein模式）：棋子穿越邊界時會改變陣營
3. **拓撲連續性**：攻擊線可以環繞整個棋盤

這些特性可能導致異常情況，理論上可能讓雙方國王同時處於被攻擊狀態。

**解決方案：多層安全檢查**

遊戲實現了以下保護機制：

1. **移動前驗證** (`getValidMoves`)
   - 過濾掉所有會讓己方國王被將軍的移動
   - 只顯示綠點在合法的安全位置

2. **移動後驗證** (`movePiece`)
   - 執行移動後立即檢查己方國王狀態
   - 如果仍被將軍，自動撤銷該移動
   - 控制台顯示警告信息

3. **遊戲狀態檢查** (`checkGameOver`)
   - 檢測是否雙方國王同時被將軍
   - 如發生異常，顯示 "⚠️ 異常：雙方都被將軍！" 警告
   - 記錄錯誤到控制台供調試

**核心原則**

- ✅ 國王**永遠不能**移動到會被將軍的位置
- ✅ **任何棋子**都不能移動後讓己方國王被將軍
- ✅ 遊戲會阻止所有違反這些規則的移動
- ✅ 即使在複雜的拓撲結構中，這些規則依然有效

#### 國王規則總結

**Q: 國王可以攻擊對方國王嗎？**
❌ 不可以。兩個國王必須保持至少一格距離。

**Q: 國王可以移動到會被將軍的位置嗎？**
❌ 不可以。這是絕對禁止的自殺式移動。

**Q: 被將軍時可以移動其他棋子嗎？**
✅ 可以，但只能移動能解除將軍的棋子（阻擋、吃掉攻擊者、移動國王）。

**Q: 在環面/克萊因瓶模式中會發生雙方同時被將軍嗎？**
❌ 理論上不應該。遊戲有多重安全機制防止這種情況。如果發生，說明遊戲檢測到了異常狀態。

## 

Non-Euclidean geometry chess is a fascinating concept that blends the strategic depth of chess with the mind-bending principles of non-Euclidean geometry.  In essence, it explores how the game of chess would change if played on surfaces or spaces that don't follow the rules of Euclidean geometry we are familiar with in everyday life (like flat planes).

Here's a breakdown of what Non-Euclidean geometry chess entails:

**Key Concepts of Non-Euclidean Geometry:**

*   **Departure from Euclidean Norms:** Euclidean geometry, named after the ancient Greek mathematician Euclid, is based on postulates that define the properties of flat planes.  Non-Euclidean geometries arise when we alter one or more of these postulates, most famously the parallel postulate.
*   **Curved Spaces:** Non-Euclidean geometries often involve curved spaces. Imagine surfaces that are not flat, like the surface of a sphere or a saddle.
*   **Different Geometries:** The two main types of non-Euclidean geometry are:
    *   **Spherical Geometry (Elliptic):**  Imagine the surface of a sphere.  Lines of longitude, for example, are "straight lines" in spherical geometry (geodesics).  In spherical geometry, there are no parallel lines; any two "straight lines" will eventually intersect.  The angles of a triangle on a sphere sum to more than 180 degrees.
    *   **Hyperbolic Geometry (Lobachevskian):**  This is harder to visualize directly in 3D space, but imagine a saddle shape.  In hyperbolic geometry, for a given line and a point not on that line, there are infinitely many parallel lines that can be drawn through the point that never intersect the original line.  The angles of a triangle in hyperbolic geometry sum to less than 180 degrees.

**Non-Euclidean Chess Implications:**

When you apply non-Euclidean geometry to chess, the game fundamentally changes in several ways:

*   **Board Shape and Topology:** The chessboard is no longer a flat square grid. It could be:
    *   **Spherical Chessboard:**  Imagine a chessboard wrapped around a sphere. The edges of the board would connect, creating a continuous surface.  Pieces moving off one edge would reappear on the opposite edge (or a connected edge in more complex spherical arrangements).
    *   **Toroidal Chessboard:** A torus (donut shape) is another non-Euclidean surface.  Chess on a torus would also have connected edges, but with different connectivity than a sphere.
    *   **Hyperbolic Chessboard:** Visualizing a hyperbolic chessboard is more abstract. It would involve a surface with a saddle-like curvature.  The properties of movement and distances would be very different.
*   **Piece Movement:** The movement of chess pieces is defined in terms of straight lines and diagonals on a Euclidean grid. In non-Euclidean geometries, "straight lines" (geodesics) behave differently.
    *   **Rooks and Bishops:**  Rooks, which move along ranks and files (straight lines), and Bishops, which move diagonally, would have their movement patterns altered to follow the "straight lines" and "diagonal lines" of the non-Euclidean space.
    *   **Knights:** Knight moves, which are defined by an L-shape, would also need to be redefined in the context of the curved space.
*   **Distance and Geometry:** The concept of distance changes in non-Euclidean spaces.  The shortest path between two points might not look "straight" in our Euclidean intuition.  Angles and shapes also behave differently.

**Challenges and Considerations:**

*   **Visualization:**  One of the biggest challenges is visualizing and understanding chess in non-Euclidean spaces, especially hyperbolic geometry. Our brains are wired for Euclidean space.
*   **Defining Rules:**  Precisely defining the rules for piece movement and board geometry in a consistent and playable way is complex. There isn't one single "Non-Euclidean Chess" but rather a range of possible variations depending on the chosen geometry and rule adaptations.
*   **Playability and Strategy:**  It's an open question how much the strategy of chess would change.  Would familiar chess principles still apply? What new strategic elements would emerge?

**Examples and Explorations:**

While not a widely played game, Non-Euclidean chess is primarily a mathematical and theoretical concept.  There have been some explorations:

*   **Theoretical Papers and Articles:** Mathematicians and game theorists have written about the possibilities of chess in non-Euclidean spaces, exploring the mathematical implications and potential rule sets.
*   **Software and Visualizations:**  Some software or visualizations might exist to demonstrate chess on spherical or toroidal boards, helping to understand the altered geometry.
*   **Conceptual Game Designs:**  Individuals have proposed rule sets and board designs for specific types of non-Euclidean chess, often as thought experiments or niche game variants.

**In Summary:**

Non-Euclidean geometry chess is a fascinating thought experiment that pushes the boundaries of both mathematics and game design. It's less about creating a practical, widely played game and more about exploring the abstract possibilities of geometry and how they could reshape familiar structures like chess.  It highlights how deeply our understanding of games is tied to the Euclidean space we typically experience.


#[#]* Links

[KleinBottleChess](https://jsfiddle.net/ewdlop/3ntyzj08/)
