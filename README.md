# ⚡ Auto Đánh Giá Form HUST

> Extension dành cho Chrome, Edge và các trình duyệt Chromium, giúp chọn nhanh cùng một mức **0 - 1 - 2 - 3 - 4** cho nhiều câu hỏi trên form đánh giá.

![Auto Đánh Giá Form Banner](docs/images/banner.png)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Local Only](https://img.shields.io/badge/Hoạt%20động-cục%20bộ-success)

---

## 🎬 Demo

### Ảnh demo

![Ảnh demo Auto Đánh Giá Form](docs/images/demo-screenshot.png)

### Video hướng dẫn

[![Xem video hướng dẫn](docs/images/video-thumbnail.png)](docs/videos/demo.mp4)

**Bấm vào ảnh trên để xem video.**

---

## 📥 Cài đặt

### Bước 1: Tải mã nguồn

Bấm **Code** → **Download ZIP** trên GitHub, hoặc tải trực tiếp tại đây:

[**Tải file ZIP**](https://github.com/phamhungcrab/auto-danh-gia-form/archive/refs/heads/main.zip)

### Bước 2: Giải nén file ZIP

Sau khi giải nén, bạn sẽ thấy thư mục ngoài có tên gần giống:

```text
auto-danh-gia-form-main
```

Mở thư mục này ra. Bên trong sẽ có thư mục:

```text
auto-rating-extension
```

**Đây mới là thư mục cần nạp vào trình duyệt.**

> **Quan trọng:** Không chọn thư mục `auto-danh-gia-form-main`. Phải mở vào đúng thư mục `auto-rating-extension`, rồi chọn chính thư mục đó.

### Bước 3: Mở trang quản lý tiện ích

Nhập địa chỉ sau vào thanh địa chỉ của trình duyệt:

```text
chrome://extensions
```

Nếu dùng Microsoft Edge, có thể nhập:

```text
edge://extensions
```

### Bước 4: Bật Chế độ dành cho nhà phát triển

Bật công tắc:

```text
Developer mode / Chế độ dành cho nhà phát triển
```

Nút này thường nằm ở góc trên bên phải.

### Bước 5: Nạp đúng thư mục extension

1. Bấm **Load unpacked** / **Tải tiện ích đã giải nén**.
2. Mở thư mục `auto-danh-gia-form-main`.
3. Bấm đúp vào thư mục `auto-rating-extension` để đi vào bên trong.
4. Khi thanh đường dẫn phía trên kết thúc bằng `auto-rating-extension` và trong cửa sổ chỉ thấy thư mục `icons`, hãy giữ nguyên tại đó.
5. Bấm **Select Folder** / **Chọn thư mục** ở góc dưới bên phải.

> Cửa sổ chọn thư mục của Windows thường chỉ hiển thị các thư mục con, nên bạn sẽ không thấy các file như `manifest.json`. Đây là bình thường. **Không mở thư mục `icons`; chỉ cần đang đứng trong `auto-rating-extension` rồi bấm Select Folder.**

Nếu làm đúng, tiện ích **Auto Đánh Giá Form** sẽ xuất hiện trong danh sách extension.

### Bước 6: Ghim extension

Bấm biểu tượng **mảnh ghép** trên thanh công cụ trình duyệt → tìm **Auto Đánh Giá Form** → bấm biểu tượng **ghim**.

---

## 🚀 Cách sử dụng

1. Mở trang form đánh giá.
2. Bấm biểu tượng **Auto Đánh Giá Form** trên thanh công cụ.
3. Chọn mức muốn đánh giá: `0`, `1`, `2`, `3` hoặc `4`.
4. Bấm nút **⚡ Chọn mức ... trên trang**.
5. Kiểm tra lại các câu đã được chọn đúng chưa.
6. Tự bấm nút gửi form sau khi kiểm tra xong.

### Nếu form dài và còn câu chưa được chọn

Một số form chỉ hiện thêm câu hỏi khi bạn kéo xuống dưới. Khi đó:

1. Kéo xuống phần chưa được chọn hoặc kéo gần cuối trang.
2. Chờ các câu hỏi mới xuất hiện.
3. Mở extension và bấm chọn mức thêm một lần nữa.

Bạn cũng có thể bấm **Hiện bảng nổi** để dùng các nút `0 1 2 3 4` trực tiếp trên trang.

---

## 🌐 Trình duyệt hỗ trợ

- Google Chrome
- Microsoft Edge
- AdsPower Browser
- Brave
- Cốc Cốc
- Các trình duyệt Chromium có mục quản lý extension

---

## 🔒 Lưu ý

Extension chỉ hỗ trợ chọn nhanh các đáp án đang hiển thị. Hãy kiểm tra lại trước khi gửi và chọn mức đánh giá đúng với ý kiến của bạn.

Extension chạy cục bộ trên trình duyệt và không tự gửi form.
