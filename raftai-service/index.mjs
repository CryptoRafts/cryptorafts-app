import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use((req,res,next)=>{
  const auth = req.headers.authorization || "";
  if(!auth.startsWith("Bearer ")) return res.status(401).json({error:"missing token"});
  // dev-key accepts anything for now
  next();
});

app.get("/healthz",(_,res)=>res.json({ok:true}));

const accept = (name)=> async (req,res)=>{
  // Validate minimally
  try{ z.object({}).passthrough().parse(req.body); }catch{ return res.status(400).json({error:"bad json"}); }
  // Return pending to simulate async AI; your webhook would later mark verified/rejected
  return res.status(202).json({status:"pending"});
};

app.post("/processKYC", accept("kyc"));
app.post("/processKYB", accept("kyb"));
app.post("/analyzePitch", accept("pitch"));
app.post("/chat", accept("chat"));
app.post("/scores/listing", accept("listing"));
app.post("/scores/liquidity", accept("liquidity"));
app.post("/scores/reputation", accept("reputation"));
app.post("/compliance", accept("compliance"));
app.post("/ido", accept("ido"));

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log("RaftAI listening on :"+port));