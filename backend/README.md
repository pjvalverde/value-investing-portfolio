# Value Investing Portfolio Backend

Este backend está construido con **FastAPI** y sirve como API para el Value Investing Portfolio App. Permite generar, consultar y justificar portafolios de inversión basados en datos reales y análisis cuantitativo/cualitativo.

## 🚀 Despliegue rápido en Railway

1. **Sube solo esta carpeta (`backend/`) a un nuevo repositorio de GitHub.**
2. Ve a [railway.app](https://railway.app/) y crea un nuevo proyecto usando tu repo.
3. Railway detectará automáticamente `requirements.txt`.
4. Usa este comando de inicio:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. En Settings > Variables, agrega:
   - `OPENBB_TOKEN` (tu token de OpenBB)
   - `DEEPSEEK_API_KEY` (tu API key de DeepSeek)
6. Cuando el deploy termine, tu API estará disponible en `https://<tu-proyecto>.up.railway.app`

## 📂 Estructura
- `main.py` — Entrypoint FastAPI
- `requirements.txt` — Dependencias Python
- `.env.example` — Ejemplo de variables de entorno (¡no subas tu `.env` real!)

## 🛠️ Endpoints principales
- `POST /generate_portfolio` — Genera el portafolio (ejecuta scripts internos)
- `GET /portfolio` — Devuelve el portafolio generado
- `GET /justification` — Devuelve la justificación/metodología
- `GET /visualizations/{img_name}` — Devuelve imágenes generadas

## 📝 Notas
- No subas `.env` real, solo `.env.example`.
- Cambia tus claves si alguna vez estuvieron expuestas.
- Si necesitas más endpoints, agrégalos en `main.py`.

---

**Desarrollado por Pablo Valverde**
