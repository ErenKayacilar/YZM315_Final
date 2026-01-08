#!/usr/bin/env python3
"""
OMR (Optical Mark Recognition) Script - Enhanced Version with ROI
Uses OpenCV to detect marked bubbles on a 5-question, 5-option (A-E) optical form.

Features:
- Robust contour detection with fallback to full image
- Proper corner ordering for perspective transform
- ROI (Region of Interest) to exclude header area
- Adaptive thresholding for varying lighting
- Debug image output with grid overlay

Usage: python omr.py <image_path> [debug_output_path]
Output: JSON with detected answers
"""

import sys
import json
import os
import cv2
import numpy as np

# Configuration
NUM_QUESTIONS = 5
NUM_OPTIONS = 5
OPTIONS = ['A', 'B', 'C', 'D', 'E']
TARGET_WIDTH = 800  # Resize images to this width for processing
MIN_CONTOUR_AREA_RATIO = 0.05  # Lowered: Contour must be at least 5% of image area
MARKING_THRESHOLD = 0.05  # Minimum 5% of cell marked to count

# ROI Configuration (Region of Interest - where bubbles are located)
ROI_TOP = 0.24      # Start from top (skip header)
ROI_BOTTOM = 0.71   # End point
ROI_LEFT = 0.23     # Start from left
ROI_RIGHT = 0.86    # End at right

def resize_image(image, target_width=TARGET_WIDTH):
    """Resize image while maintaining aspect ratio"""
    height, width = image.shape[:2]
    if width > target_width:
        ratio = target_width / width
        new_height = int(height * ratio)
        return cv2.resize(image, (target_width, new_height), interpolation=cv2.INTER_AREA)
    return image

def order_corners(pts):
    """
    Order 4 points in: top-left, top-right, bottom-right, bottom-left
    """
    rect = np.zeros((4, 2), dtype="float32")
    pts = pts.reshape(4, 2)
    
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Top-left
    rect[2] = pts[np.argmax(s)]  # Bottom-right
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Top-right
    rect[3] = pts[np.argmax(diff)]  # Bottom-left
    
    return rect

def find_form_contour(image):
    """
    Find the form's black border using robust contour detection
    Returns the 4 corners of the form or None if not found
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Multiple detection approaches
    approaches = [
        # Approach 1: Standard Canny
        cv2.Canny(blurred, 50, 150),
        # Approach 2: Lower thresholds
        cv2.Canny(blurred, 30, 100),
        # Approach 3: Higher thresholds
        cv2.Canny(blurred, 75, 200),
        # Approach 4: Very low thresholds
        cv2.Canny(blurred, 20, 80),
        # Approach 5: Adaptive threshold then Canny
        cv2.Canny(cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                        cv2.THRESH_BINARY_INV, 11, 2), 50, 150),
        # Approach 6: Otsu threshold
        cv2.Canny(cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1], 50, 150),
    ]
    
    image_area = image.shape[0] * image.shape[1]
    min_area = image_area * MIN_CONTOUR_AREA_RATIO
    
    for edges in approaches:
        # Dilate to close gaps - try multiple iterations
        for dilation_iterations in [1, 2, 3]:
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=dilation_iterations)
            
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours = sorted(contours, key=cv2.contourArea, reverse=True)
            
            for contour in contours[:10]:  # Check top 10 contours
                area = cv2.contourArea(contour)
                
                if area < min_area:
                    continue
                
                # Try different epsilon values for approxPolyDP
                for eps_factor in [0.02, 0.03, 0.04, 0.05]:
                    peri = cv2.arcLength(contour, True)
                    approx = cv2.approxPolyDP(contour, eps_factor * peri, True)
                    
                    if len(approx) == 4:
                        corners = order_corners(approx)
                        
                        # Relaxed rectangularity check (50% instead of 70%)
                        width1 = np.linalg.norm(corners[1] - corners[0])
                        width2 = np.linalg.norm(corners[2] - corners[3])
                        height1 = np.linalg.norm(corners[3] - corners[0])
                        height2 = np.linalg.norm(corners[2] - corners[1])
                        
                        if max(width1, width2) > 0 and max(height1, height2) > 0:
                            width_ratio = min(width1, width2) / max(width1, width2)
                            height_ratio = min(height1, height2) / max(height1, height2)
                            
                            # Very relaxed check - just needs to be somewhat rectangular
                            if width_ratio > 0.5 and height_ratio > 0.5:
                                return corners
    
    return None

def perspective_transform(image, corners):
    """Apply perspective transform to get a top-down view of the form"""
    width1 = np.linalg.norm(corners[1] - corners[0])
    width2 = np.linalg.norm(corners[2] - corners[3])
    max_width = int(max(width1, width2))
    
    height1 = np.linalg.norm(corners[3] - corners[0])
    height2 = np.linalg.norm(corners[2] - corners[1])
    max_height = int(max(height1, height2))
    
    max_width = max(max_width, 200)
    max_height = max(max_height, 200)
    
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))
    
    return warped

def analyze_answers(warped):
    """Analyze the warped form image to detect marked answers"""
    height, width = warped.shape[:2]
    
    roi_x1 = int(width * ROI_LEFT)
    roi_x2 = int(width * ROI_RIGHT)
    roi_y1 = int(height * ROI_TOP)
    roi_y2 = int(height * ROI_BOTTOM)
    
    roi_bounds = (roi_x1, roi_y1, roi_x2, roi_y2)
    
    roi = warped[roi_y1:roi_y2, roi_x1:roi_x2]
    
    if len(roi.shape) == 3:
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    else:
        gray_roi = roi
    
    thresh = cv2.adaptiveThreshold(
        gray_roi, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 
        11, 2
    )
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    roi_height, roi_width = thresh.shape
    
    cell_width = roi_width // NUM_OPTIONS
    cell_height = roi_height // NUM_QUESTIONS
    
    answers = []
    cell_data = []
    
    for row in range(NUM_QUESTIONS):
        row_start = row * cell_height
        row_end = (row + 1) * cell_height
        cell_margin_y = int(cell_height * 0.15)
        
        row_pixels = []
        
        for col in range(NUM_OPTIONS):
            col_start = col * cell_width
            col_end = (col + 1) * cell_width
            cell_margin_x = int(cell_width * 0.15)
            
            cell = thresh[
                row_start + cell_margin_y : row_end - cell_margin_y,
                col_start + cell_margin_x : col_end - cell_margin_x
            ]
            
            pixel_count = cv2.countNonZero(cell)
            total_pixels = cell.shape[0] * cell.shape[1] if cell.size > 0 else 1
            fill_ratio = pixel_count / total_pixels
            
            abs_x1 = roi_x1 + col_start
            abs_y1 = roi_y1 + row_start
            abs_x2 = roi_x1 + col_end
            abs_y2 = roi_y1 + row_end
            
            row_pixels.append({
                'col': col,
                'option': OPTIONS[col],
                'pixels': pixel_count,
                'ratio': fill_ratio,
                'bounds': (abs_x1, abs_y1, abs_x2, abs_y2),
                'roi_bounds': (col_start, row_start, col_end, row_end)
            })
        
        max_cell = max(row_pixels, key=lambda x: x['ratio'])
        
        if max_cell['ratio'] >= MARKING_THRESHOLD:
            answers.append(max_cell['option'])
        else:
            answers.append('?')
        
        cell_data.append({
            'question': row + 1,
            'answer': answers[-1],
            'cells': row_pixels,
            'max_ratio': max_cell['ratio']
        })
    
    return answers, thresh, cell_data, roi_bounds

def create_debug_image(warped, cell_data, roi_bounds, output_path):
    """Create a debug image showing the ROI area and detected answers"""
    if len(warped.shape) == 2:
        debug = cv2.cvtColor(warped, cv2.COLOR_GRAY2BGR)
    else:
        debug = warped.copy()
    
    roi_x1, roi_y1, roi_x2, roi_y2 = roi_bounds
    
    cv2.rectangle(debug, (roi_x1, roi_y1), (roi_x2, roi_y2), (255, 0, 0), 3)
    cv2.putText(debug, "BUBBLE AREA", (roi_x1 + 5, roi_y1 - 10),
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    
    cv2.putText(debug, "HEADER (SKIPPED)", (10, 25),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (128, 128, 128), 2)
    
    for row_data in cell_data:
        question = row_data['question']
        detected = row_data['answer']
        
        for cell in row_data['cells']:
            x1, y1, x2, y2 = cell['bounds']
            option = cell['option']
            ratio = cell['ratio']
            
            color = (0, 255, 0)
            thickness = 1
            
            if option == detected and detected != '?':
                color = (0, 0, 255)
                thickness = 2
            
            cv2.rectangle(debug, (x1, y1), (x2, y2), color, thickness)
            cv2.putText(debug, f"{ratio:.2f}", (x1 + 5, y1 + 15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 0, 255), 1)
        
        first_cell = row_data['cells'][0]['bounds']
        cv2.putText(debug, f"Q{question}={detected}", 
                   (5, first_cell[1] + 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
    
    if cell_data and cell_data[0]['cells']:
        for i, cell in enumerate(cell_data[0]['cells']):
            x1, y1, x2, y2 = cell['bounds']
            center_x = (x1 + x2) // 2
            cv2.putText(debug, OPTIONS[i], (center_x - 5, roi_y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    answers_str = ' '.join([d['answer'] for d in cell_data])
    cv2.putText(debug, f"Answers: {answers_str}", 
               (10, debug.shape[0] - 10),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    
    try:
        cv2.imwrite(output_path, debug)
    except Exception as e:
        print(f"Warning: Could not save debug image: {e}", file=sys.stderr)

def process_image(image_path, debug_output=None):
    """Main processing pipeline with fallback"""
    used_fallback = False
    
    try:
        # Step 1: Read image
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "Could not read image file", "answers": None}
        
        # Step 2: Resize for faster processing
        image = resize_image(image, TARGET_WIDTH)
        
        # Step 3: Find form contour
        corners = find_form_contour(image)
        
        # FALLBACK: If no border found, use the whole image
        if corners is None:
            used_fallback = True
            height, width = image.shape[:2]
            # Use image corners as fallback
            corners = np.array([
                [0, 0],
                [width - 1, 0],
                [width - 1, height - 1],
                [0, height - 1]
            ], dtype="float32")
        
        # Step 4: Apply perspective transform
        warped = perspective_transform(image, corners)
        
        # Step 4.5: AUTO-ROTATE FIX
        # If image is landscape (width > height), rotate 90 degrees clockwise
        (h, w) = warped.shape[:2]
        if w > h:
            warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
        
        # Step 5: Analyze answers (with ROI to skip header)
        answers, thresh_image, cell_data, roi_bounds = analyze_answers(warped)
        
        # Step 6: Create debug image
        if debug_output:
            create_debug_image(warped, cell_data, roi_bounds, debug_output)
        
        # ALWAYS return success if we got answers
        return {
            "success": True,
            "answers": answers,
            "debug_image": debug_output,
            "usedFallback": used_fallback,
            "note": "Used full image (no border detected)" if used_fallback else "Border detected successfully",
            "roi": {
                "top": ROI_TOP,
                "bottom": ROI_BOTTOM,
                "left": ROI_LEFT,
                "right": ROI_RIGHT
            },
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Processing error: {str(e)}",
            "answers": None
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python omr.py <image_path> [debug_output_path]", "answers": None}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if len(sys.argv) >= 3:
        debug_output = sys.argv[2]
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        uploads_dir = os.path.join(script_dir, '..', 'uploads')
        if os.path.exists(uploads_dir):
            debug_output = os.path.join(uploads_dir, 'debug_result.jpg')
        else:
            debug_output = None
    
    result = process_image(image_path, debug_output)
    print(json.dumps(result, default=str))

if __name__ == "__main__":
    main()
