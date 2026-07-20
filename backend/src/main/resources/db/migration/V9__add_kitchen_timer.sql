-- Cho phép đầu bếp tự đặt thời gian dự kiến nấu cho từng đơn hàng khi bắt đầu nấu.
-- estimated_minutes: đầu bếp nhập tay lúc bấm "Play" trên màn hình Kitchen (KDS).
-- cooking_started_at: thời điểm thực sự bắt đầu nấu (set khi bấm "Play").
-- Frontend tự tính % progress = (NOW() - cooking_started_at) / estimated_minutes * 100

ALTER TABLE orders
  ADD COLUMN estimated_minutes  INT UNSIGNED NULL AFTER kitchen_status,
  ADD COLUMN cooking_started_at DATETIME NULL AFTER estimated_minutes;