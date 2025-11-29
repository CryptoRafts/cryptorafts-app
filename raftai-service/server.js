import express from "express"; import cors from "cors";
const app = express(); app.use(cors()); app.use(express.json());

function needAuth(req,res,next){ if((req.headers["authorization"]||"")!== "Bearer "+(process.env.RAFTAI_API_KEY||"dev-key")) return res.status(401).json({ok:false,error:"unauthorized"}); next(); }

app.get("/healthz", (req,res)=> res.json({ ok:true, ts: Date.now() }));

app.post("/processKYC", needAuth, (req,res)=> res.status(202).json({ ok:true, status:"processing"}));
app.post("/processKYB", needAuth, (req,res)=> res.status(202).json({ ok:true, status:"processing"}));
app.post("/analyzePitch", needAuth, (req,res)=> res.status(202).json({ ok:true, status:"processing"}));

app.post("/chat", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"LLM provider not configured" }));
app.post("/scores/listing", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"provider not configured" }));
app.post("/scores/liquidity", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"provider not configured" }));
app.post("/scores/reputation", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"provider not configured" }));
app.post("/compliance", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"provider not configured" }));
app.post("/ido", needAuth, (req,res)=> res.status(501).json({ ok:false, error:"provider not configured" }));

app.listen(8080, ()=> console.log("RaftAI stub on :8080"));
