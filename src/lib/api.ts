import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.errors[0]?.message ?? "Please check the submitted data.",
        code: "VALIDATION_ERROR",
        issues: error.flatten()
      },
      { status: 422 }
    );
  }

  console.error(error);
  return NextResponse.json({ ok: false, error: "Something went wrong. Please try again.", code: "SERVER_ERROR" }, { status: 500 });
}
