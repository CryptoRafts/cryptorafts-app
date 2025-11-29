import { NextRequest, NextResponse } from "next/server";
import { verifyDepartmentToken, setDepartmentClaims } from "@/server/firebaseAdmin";
import { auditLogger } from "@/server/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { department } = await req.json();
    
    if (!department) {
      return NextResponse.json({ error: "Department not specified" }, { status: 400 });
    }

    const decodedToken = await verifyDepartmentToken(token);
    
    // Set department claims if not already set
    const claims = decodedToken as any;
    if (!claims.dept || !claims.dept[department]) {
      await setDepartmentClaims(decodedToken.uid, { [department]: true });
      
      // Log department access
      await auditLogger.logDepartmentAction(
        decodedToken.uid,
        department,
        "department_access_granted",
        { department, timestamp: Date.now() }
      );
    }

    // Set department cookies for middleware
    const response = NextResponse.json({ 
      success: true, 
      message: "Department access granted",
      department
    });

    response.cookies.set("cr_dept", department, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Department guard completion error:", error);
    return NextResponse.json({ 
      error: "Failed to complete department authentication",
      details: error.message 
    }, { status: 500 });
  }
}
