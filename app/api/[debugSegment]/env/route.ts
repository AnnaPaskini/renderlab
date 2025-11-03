import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { GET as getDebugEnv } from "../../_debug/env/route";

type Params = { debugSegment: string };

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> | Params }
) {
  const params = context.params instanceof Promise ? await context.params : context.params;

  if (params.debugSegment !== "_debug") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return getDebugEnv();
}
