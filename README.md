# :clapper: CutAI — AI 电影导演与分镜引擎

**将任何创意转化为逐镜头分镜板，AI 驱动的场景分析、情绪评分和配乐氛围。**

🌐 **[在线演示](https://cut-ai-nbx8.vercel.app)** | 📦 **[GitHub](https://github.com/Swapnil-bo/CutAI)**

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-LLama_3.1-F55036?logo=groq&logoColor=white)](https://groq.com)
[![Ollama](https://img.shields.io/badge/Ollama-Qwen_2.5-000000?logo=ollama&logoColor=white)](https://ollama.com)
[![SQLite](https://img.shields.io/badge/SQLite-Async-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![React Flow](https://img.shields.io/badge/React_Flow-Timeline-FF0072?logo=react&logoColor=white)](https://reactflow.dev)
[![Recharts](https://img.shields.io/badge/Recharts-Mood_Graph-8884D8)](https://recharts.org)

---

## 功能简介

CutAI 接收一段短剧本——可以是你自己写的，也可以让 AI 根据类型和前提设定生成——并将其拆解为专业的、可拍摄的场景，包含逐镜头分解、机位建议、情绪分析和配乐氛围。所有内容呈现在拖拽式可视化分镜编辑器中，采用暗色电影剪辑风格。可以理解为 Figma + 剧本软件 + AI 的结合体。

---

## 功能特性

**:scroll: AI 剧本生成**
输入类型和前提设定，CutAI 自动生成结构完整的短剧本，包含场景标题行、动作描述和对白。

**:movie_camera: 逐镜头分解**
每个场景被拆解为独立镜头，包含镜头类型（全景、特写、跟踪）、机位（仰角、倾斜、鸟瞰）、运动方式（推拉、摇臂、摇镜）和时长估算。

**:art: 富文本分镜面板**
场景卡片采用情绪渐变背景、等宽场景描述、时间指示器、机位标签和角色标记——呈现专业电影制作文档质感，无需图像生成。

**:drag: 拖拽式分镜画布**
在响应式网格上拖拽卡片即可重排场景顺序，修改即时持久化到数据库。

**:bar_chart: 情绪分析**
四维情绪评分（紧张感、情感、活力、暗度），通过 Recharts 交互图表以曲线形式展示场景间的情绪变化。

**:musical_note: 配乐氛围**
为每个场景提供配乐建议，包含音乐类型、节奏、乐器和参考曲目（例如"类似：汉斯·季默 — Time"）。

**:railway_track: 可视化时间线**
基于 React Flow 的时间线，带有情绪色彩节点、场景连接和点击导航同步分镜板。

**:pencil2: 内联编辑与重新生成**
直接内联编辑场景标题、描述和镜头详情，一键重新生成任意场景的分析。

**:package: 导出**
将分镜板导出为 JSON 或专业排版的 PDF，包含情绪条、镜头表格和场景分解。

**:house: 项目管理**
从画廊首页创建、查看、复制和删除项目。

---

## 截图

### 分镜画布 — 情绪渐变场景卡片
![Storyboard](docs/screenshots/storyboard.png)

### 剧本风格镜头分解
![Shot Panel](docs/screenshots/shot-panel.png)

### React Flow 可视化时间线
![Timeline](docs/screenshots/timeline.png)

### 情绪曲线 — 四维分析
![Mood Graph](docs/screenshots/mood-arc.png)

### 机位分解与配乐氛围
![Analysis](docs/screenshots/analysis.png)

---

## 双 LLM 架构

CutAI 支持**两种模式**进行 LLM 生成，通过一个环境变量即可切换：

### :cloud: 云端模式 — Groq API
- **模型：** `llama-3.1-8b-instant`
- **速度：** 超快推理（~300 tokens/秒）
- **要求：** 只需免费的 Groq API 密钥，无需 GPU，任何机器都能运行
- **适用场景：** 部署、低配机器、快速迭代

### :computer: 本地模式 — Ollama
- **模型：** `qwen2.5:3b`（或 `qwen2.5:7b` 获更高质量）
- **速度：** 中等（取决于 GPU）
- **要求：** NVIDIA GPU（4-6GB 显存），已安装 Ollama
- **适用场景：** 完全离线使用、零 API 费用、无限生成、隐私保护

通过环境变量一键切换：
```bash
LLM_PROVIDER=groq    # 云端模式（默认）
LLM_PROVIDER=local   # 本地模式（通过 Ollama）
```

CutAI 还支持 **本地 Stable Diffusion 1.5** 用于 AI 生成分镜画面（需要足够显存的 GPU）：
```bash
IMAGE_PROVIDER=local      # 本地 SD 1.5（需要 NVIDIA GPU，6GB+ 显存）
IMAGE_PROVIDER=replicate  # Replicate API（云端）
```

---

## 架构

```
用户输入（类型 + 前提设定 或 原始剧本）
         |
         v
  ┌──────────────┐
  │   LLM 引擎   │  Groq API 或本地 Ollama
  │  (Llama/Qwen)│
  └──────┬───────┘
         │
         v
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  剧本解析器   │────>│  场景分析器   │────>│ SD 提示词    │
  │ (场景 + 结构) │     │(镜头、情绪、  │     │   生成器     │
  │              │     │  配乐)        │     │  (每个镜头)  │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                     │
         v                    v                     v
  ┌─────────────────────────────────────────────────────────┐
  │                    SQLite 数据库                         │
  │  项目 → 剧本 → 场景 → 镜头（含 SD 提示词）               │
  └────────────────────────┬────────────────────────────────┘
                           │
                           v
  ┌─────────────────────────────────────────────────────────┐
  │                   React 前端                             │
  │  分镜画布 │ 镜头面板 │ 时间线 │ 情绪图表                  │
  └─────────────────────────────────────────────────────────┘
```

---

## 本地部署

### 前置条件
- Python 3.11+
- Node.js 18+
- [Groq API 密钥](https://console.groq.com)（免费额度即可）

### 1. 克隆
```bash
git clone https://github.com/zeguzy/CutAI.git
cd CutAI
```

### 2. 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 前端
```bash
cd frontend
npm install
```

### 4. 环境变量
创建 `backend/.env`：
```env
GROQ_API_KEY=你的_Groq_API_密钥
LLM_PROVIDER=groq
```

### 5. 运行
```bash
# 终端 1 — 后端
cd backend
uvicorn main:app --reload --port 8000

# 终端 2 — 前端
cd frontend
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173) 开始创作。

---

## 本地 LLM 配置（可选）

完全离线生成，零 API 费用：

### 1. 安装 Ollama
从 [ollama.com](https://ollama.com) 下载安装。

### 2. 拉取模型
```bash
ollama pull qwen2.5:3b    # 轻量版，约 2GB 显存
# 或
ollama pull qwen2.5:7b    # 更高质量，约 4.5GB 显存
```

### 3. 配置
更新 `backend/.env`：
```env
LLM_PROVIDER=local
OLLAMA_MODEL=qwen2.5:3b
```

### 4. 运行 Ollama
Ollama 安装后会自动作为后台服务运行。验证：
```bash
ollama ps        # 查看已加载的模型
ollama list      # 查看已安装的模型
```

---

## 硬件要求

| 模式 | GPU | 内存 | 备注 |
|------|-----|------|------|
| **云端（Groq）** | 无需 | 4 GB+ | 任何机器都能运行——笔记本、台式机，甚至树莓派 |
| **本地 LLM（Ollama）** | NVIDIA RTX 3050+（4-6GB 显存） | 8 GB+ | Qwen 2.5 3B 约 2GB 显存，7B 约 4.5GB |
| **本地 LLM + SD 1.5** | NVIDIA RTX 3050+（6GB 显存） | 8 GB+ | 顺序流水线——LLM 和 SD 不会同时运行 |

> **注意：** 在 8GB 内存系统上，Ollama 上下文窗口限制为 `num_ctx=4096` 以防止内存压力。使用本地生成时请关闭不必要的应用。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18, Vite, Tailwind CSS, Zustand, Framer Motion |
| **拖拽** | @dnd-kit/core, @dnd-kit/sortable |
| **时间线** | React Flow |
| **图表** | Recharts |
| **后端** | FastAPI, Python 3.13, Pydantic v2 |
| **数据库** | SQLite + SQLAlchemy（异步 aiosqlite） |
| **云端 LLM** | Groq API (llama-3.1-8b-instant) |
| **本地 LLM** | Ollama (qwen2.5:3b / qwen2.5:7b) |
| **图像生成** | Stable Diffusion 1.5（本地）/ Replicate SDXL（云端） |
| **PDF 导出** | fpdf2 |
| **图标** | Lucide React |

---

## 未来计划

- **AI 生成分镜画面** — 本地 Stable Diffusion 1.5 为每个镜头生成图像
- **Replicate SDXL 集成** — 云端图像生成，无需 GPU
- **音频生成** — 基于情绪评分和配乐氛围的 AI 作曲
- **视频导出** — 将分镜画面拼接为动态分镜视频，含镜头时长和转场
- **协作编辑** — 基于 WebSocket 的实时多人分镜编辑
- **版本历史** — 场景级别的撤销/重做和版本对比
- **自定义美术风格** — LoRA 微调模型，为项目保持一致的视觉风格

---

## 项目结构

```
cutai/
├── backend/
│   ├── main.py              # FastAPI 应用 + CORS + 静态文件
│   ├── config.py            # 设置、模型名称、环境变量
│   ├── models/
│   │   ├── database.py      # 异步 SQLAlchemy 引擎
│   │   ├── schemas.py       # Pydantic 模型（剧本、场景、镜头、情绪、配乐）
│   │   └── db_models.py     # SQLAlchemy ORM 模型
│   ├── services/
│   │   ├── llm_client.py    # Ollama/Groq 封装（JSON 模式）
│   │   ├── script_parser.py # 剧本生成 + 解析
│   │   ├── scene_analyzer.py# 镜头、情绪、配乐分析
│   │   └── vram_manager.py  # GPU 显存管理
│   └── routers/
│       ├── storyboard.py    # 生成流水线 + SSE + 导出
│       ├── scenes.py        # 场景增删改查 + 重新生成
│       ├── scripts.py       # 剧本增删改查
│       └── projects.py      # 项目管理
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── storyboard/  # 画布、场景卡片、镜头面板
│       │   ├── timeline/    # React Flow 可视化时间线
│       │   ├── analysis/    # 情绪图表、配乐面板、机位标签
│       │   ├── script/      # 剧本编辑器、剧本生成器
│       │   └── layout/      # 头部、侧边栏、主画布
│       └── stores/          # Zustand（项目、分镜、UI 状态）
└── docs/screenshots/
```

---

<p align="center">
  由 <strong>Swapnil</strong> 构建，<strong>100 Days of Vibe Coding</strong> 系列<br/>
  由 Claude Code (Opus 4.6) 驱动
</p>
