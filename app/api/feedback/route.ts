import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "feedbacks.json");

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  fuelType: string;
  rating: string;
  feedback: string;
  createdAt: string;
}

function getLocalFeedbacks(): FeedbackItem[] {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading local feedbacks file:", e);
  }
  return [];
}

function saveLocalFeedbacks(items: FeedbackItem[]) {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing local feedbacks file:", e);
  }
}

// POST endpoint - Post data (Create feedback)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, mobile, fuelType, rating, feedback } = body;

    // Server-side validation
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = "Customer name is required";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Valid email address is required";
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!fuelType || fuelType === "-- Select Fuel Type --") {
      errors.fuelType = "Please select a fuel type";
    }

    if (!rating || rating === "-- Select Rating --") {
      errors.rating = "Please select a service rating";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors, message: "Validation failed" },
        { status: 400 }
      );
    }

    const newFeedback: FeedbackItem = {
      id: "FB-" + Math.floor(100000 + Math.random() * 900000),
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      fuelType,
      rating,
      feedback: feedback ? feedback.trim() : "",
      createdAt: new Date().toISOString(),
    };

    // 1. Save local copy
    const current = getLocalFeedbacks();
    current.unshift(newFeedback);
    saveLocalFeedbacks(current);

    // 2. Forward to Google Apps Script Web App
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
    if (googleSheetUrl && googleSheetUrl.trim().length > 0) {
      try {
        await fetch(googleSheetUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(newFeedback),
          redirect: "follow",
        });
      } catch (gErr) {
        console.error("Failed to sync feedback to Google Sheet WebApp:", gErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your valuable feedback!",
      data: newFeedback,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint - Pull data (List all / Filter by date range) & View data (Single item by ID)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const range = searchParams.get("range") || "all";
  const customStart = searchParams.get("startDate");
  const customEnd = searchParams.get("endDate");

  let sourceFeedbacks = getLocalFeedbacks();

  // Live fetch from Google Sheet WebApp
  const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (googleSheetUrl && googleSheetUrl.trim().length > 0) {
    try {
      const gRes = await fetch(googleSheetUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        redirect: "follow",
      });

      if (gRes.ok) {
        const text = await gRes.text();
        try {
          const gData = JSON.parse(text);
          if (gData.success && Array.isArray(gData.feedbacks)) {
            sourceFeedbacks = gData.feedbacks;
            saveLocalFeedbacks(sourceFeedbacks); // Sync local copy with live Google Sheet
          }
        } catch (pErr) {
          // Response was not valid JSON
        }
      }
    } catch (gErr) {
      console.warn("Could not fetch live Google Sheet data, falling back to local file store:", gErr);
    }
  }

  // View Data for single item by ID
  if (id) {
    const singleItem = sourceFeedbacks.find((item) => item.id === id);
    if (!singleItem) {
      return NextResponse.json(
        { success: false, message: `Feedback with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      feedback: singleItem,
      data: singleItem,
    });
  }

  // Pull Data with Date Filtering
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let filtered = [...sourceFeedbacks];

  if (range === "today") {
    filtered = filtered.filter((item) => new Date(item.createdAt) >= startOfToday);
  } else if (range === "yesterday") {
    filtered = filtered.filter((item) => {
      const d = new Date(item.createdAt);
      return d >= startOfYesterday && d <= endOfYesterday;
    });
  } else if (range === "week") {
    filtered = filtered.filter((item) => new Date(item.createdAt) >= startOfWeek);
  } else if (range === "month") {
    filtered = filtered.filter((item) => new Date(item.createdAt) >= startOfMonth);
  } else if (range === "year") {
    filtered = filtered.filter((item) => new Date(item.createdAt) >= startOfYear);
  } else if (range === "custom" && (customStart || customEnd)) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const isAfterStart = customStart ? itemDate >= new Date(customStart) : true;
      const isBeforeEnd = customEnd ? itemDate <= new Date(customEnd + "T23:59:59.999Z") : true;
      return isAfterStart && isBeforeEnd;
    });
  }

  return NextResponse.json({
    success: true,
    range,
    total: filtered.length,
    feedbacks: filtered,
  });
}

// DELETE endpoint - Delete data by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // Body was empty
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const current = getLocalFeedbacks();
    const updated = current.filter((item) => item.id !== id);
    saveLocalFeedbacks(updated);

    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
    if (googleSheetUrl && googleSheetUrl.trim().length > 0) {
      try {
        await fetch(googleSheetUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "delete", id }),
          redirect: "follow",
        });
      } catch (gErr) {
        console.error("Failed to delete row from Google Sheet WebApp:", gErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Feedback ${id} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint - Update data
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, mobile, fuelType, rating, feedback } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = "Customer name is required";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Valid email address is required";
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!fuelType || fuelType === "-- Select Fuel Type --") {
      errors.fuelType = "Please select a fuel type";
    }

    if (!rating || rating === "-- Select Rating --") {
      errors.rating = "Please select a service rating";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors, message: "Validation failed" },
        { status: 400 }
      );
    }

    const current = getLocalFeedbacks();
    const index = current.findIndex((item) => item.id === id);

    const updatedFeedback: FeedbackItem = {
      id,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      fuelType,
      rating,
      feedback: feedback ? feedback.trim() : "",
      createdAt: index !== -1 ? current[index].createdAt : new Date().toISOString(),
    };

    if (index !== -1) {
      current[index] = updatedFeedback;
    } else {
      current.unshift(updatedFeedback);
    }
    saveLocalFeedbacks(current);

    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
    if (googleSheetUrl && googleSheetUrl.trim().length > 0) {
      try {
        await fetch(googleSheetUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "update", ...updatedFeedback }),
          redirect: "follow",
        });
      } catch (gErr) {
        console.error("Failed to sync update to Google Sheet WebApp:", gErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Feedback ${id} updated successfully`,
      data: updatedFeedback,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
