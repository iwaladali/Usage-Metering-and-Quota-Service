import { createHash, hash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db/index.js";
import { apiKeys } from "./db/schema.js";
import { eq } from "drizzle-orm";


export function hashApiKey(apiKey: string): string{         
      return  createHash("sha256").update(apiKey).digest("hex");
}

type ApiKey = typeof apiKeys.$inferSelect;

export async function getApiKey(hash: string):  Promise<ApiKey | undefined> {
    const [resultApiKey]=
    await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash));

    if(!resultApiKey)
        return undefined;

    return resultApiKey;

}

export async function authMiddleware(req:Request, res:Response, next:NextFunction) {
    try{
    const authorization = req.header("Authorization");
    const prefix="Bearer ";
    if (!authorization?.startsWith(prefix)) {
      res.status(401).json({
        error: "Missing API key",
      });
      return;
    }
    const apiKey= authorization.split(" ")[1];
    if(!apiKey){
        res.status(401).json({
          error: "Missing API key",
        });
        return;
    }
    
    const hashedApiKey= await hashApiKey(apiKey!);
    
    const apiKeyRecord =await getApiKey(hashedApiKey);
    
    
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      res.status(401).json({
        error: "Invalid API key",
      });
      return;
    }

    if (apiKeyRecord.expiresAt &&apiKeyRecord.expiresAt.getTime() <= Date.now()) {
      res.status(401).json({
        error: "Expired API key",
      });
      return;
    }

    if (!apiKeyRecord.accountId) {
      res.status(401).json({
        error: "Invalid API key owner",
      });
      return;
    }

    res.locals.accountId = apiKeyRecord.accountId;
    res.locals.apiKeyId = apiKeyRecord.id;

    next();
  }catch (error) {
    next(error);
  }


}