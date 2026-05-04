# ClassPulse Attendance

Demo MVP diem danh hoc sinh bang QR code voi 3 vai tro:
- Teacher: quet QR, xem ket qua, xem lich su diem danh
- Parent: xem tong quan, lich su diem danh, thong tin tai khoan
- Admin: quan ly hoc sinh, lop hoc, nguoi dung, xem thong ke

## Cau truc

- `backend`: Node.js + Express + MongoDB API
- `frontend`: Expo React Native app

## Yeu cau

- Node.js 18+
- npm
- MongoDB local hoac MongoDB Atlas
- Expo Go hoac Android/iOS simulator

## 1. Chay backend

Tao file `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/classpulse
PORT=5000
CLIENT_ORIGIN=*
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

Chay backend:

```powershell
cd D:\Project\DiemDanhTN\backend
npm install
npm run dev
```

Backend mac dinh se chay tai:

```text
http://localhost:5000
```

Base API:

```text
http://localhost:5000/api/v1
```

## 2. Seed du lieu demo

Sau khi backend ket noi MongoDB thanh cong, chay:

```powershell
cd D:\Project\DiemDanhTN\backend
npm run seed
```

Hoac neu muon bo du lieu phong phu hon de test CRUD, dashboard va popup chi tiet:

```powershell
cd D:\Project\DiemDanhTN\backend
npm run seed2
```

Luu y:
- Lenh seed hien tai se xoa toan bo data trong database dev dang tro toi boi `MONGODB_URI`
- Sau do tao lai du lieu mau theo schema moi nhat
- `seed2` cung xoa du lieu cu trong database dev truoc khi tao bo du lieu moi

Tai khoan mau duoc tao boi seed:

| Vai tro | Email | Mat khau |
|---|---|---|
| Teacher | `teacher@classpulse.local` | `Password123!` |
| Parent | `parent@classpulse.local` | `Password123!` |
| Admin | `admin@classpulse.local` | `Password123!` |

Seed cung tao:
- 1 lop hoc `Lop 1A`
- 5 hoc sinh demo
- lien ket phu huynh voi hoc sinh

Tai khoan mau them khi chay `npm run seed2`:

| Vai tro | Email | Mat khau |
|---|---|---|
| Admin | `admin@classpulse.local` | `Password123!` |
| Giao vien | `giaovien1@classpulse.local` | `Password123!` |
| Giao vien | `giaovien2@classpulse.local` | `Password123!` |
| Giao vien | `giaovien3@classpulse.local` | `Password123!` |
| Phu huynh | `phuhuynh1@classpulse.local` | `Password123!` |
| Phu huynh | `phuhuynh2@classpulse.local` | `Password123!` |
| Phu huynh | `phuhuynh3@classpulse.local` | `Password123!` |
| Phu huynh | `phuhuynh4@classpulse.local` | `Password123!` |

`seed2` cung tao:
- 3 lop hoc voi trang thai hoat dong khac nhau
- 8 hoc sinh co ho ten tieng Viet co dau
- du thong tin dia chi, anh dai dien, trang thai, kich hoat
- 5 ban ghi diem danh
- thong bao mau cho phu huynh

## 3. Chay frontend

```powershell
cd D:\Project\DiemDanhTN\frontend
npm install
npm run start
```

Mac dinh frontend goi API:
- Android emulator: `http://10.0.2.2:5000/api/v1`
- Cac nen tang khac: `http://localhost:5000/api/v1`

Neu backend chay o host khac, set bien moi truong truoc khi start frontend:

```powershell
$env:EXPO_PUBLIC_API_URL="http://YOUR_IP:5000/api/v1"
npm run start
```

Vi du khi test tren dien thoai that va backend chay tren may tinh cung mang LAN:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:5000/api/v1"
npm run start
```

## 4. Dang nhap demo

Neu da chay `npm run seed`, co the dang nhap nhanh bang cac tai khoan sau:

- Teacher: `teacher@classpulse.local` / `Password123!`
- Parent: `parent@classpulse.local` / `Password123!`
- Admin: `admin@classpulse.local` / `Password123!`

## 5. Flow demo hien tai

Teacher:
- Dang nhap
- Mo man hinh quet QR
- Quet QR hoac chon hoc sinh tu danh sach demo
- Xac nhan diem danh
- Xem lich su diem danh
- Xem profile

Parent:
- Dang nhap
- Xem trang thai diem danh hom nay
- Xem thong tin con
- Xem lich su diem danh
- Xem profile

Admin:
- Dang nhap
- Xem tong quan he thong (thong ke so luong hoc sinh, lop, giao vien, phu huynh)
- Quan ly hoc sinh: them, sua, xoa hoc sinh
- Quan ly lop hoc: gan giao vien cho lop
- Quan ly nguoi dung: them, sua, xoa tai khoan giao vien/phu huynh
- Xem profile

## 6. Neu app khong ket noi duoc backend

Kiem tra lan luot:

1. Backend da chay chua
2. MongoDB da ket noi chua
3. Da chay `npm run seed` chua
4. `EXPO_PUBLIC_API_URL` co dung host/IP khong
5. Neu test tren dien thoai that, may tinh va dien thoai co cung mang khong

## 7. Ghi chu

- Frontend hien la ban demo MVP toi gian.
- QR scanner co fallback bang danh sach hoc sinh demo neu thiet bi khong mo duoc camera.
- Neu muon mo rong them shared component hoac tach item list/badge, co the lam sau khi flow demo da on dinh.
