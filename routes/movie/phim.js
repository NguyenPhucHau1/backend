var express = require('express');
var router = express.Router();
const multer = require('multer');
const Phim = require('../../models/movie/phim');
const PhimTheLoai = require('../../models/movie/phimtheloai');
const TheLoai = require('../../models/movie/theloai'); 
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/img/phims')); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);  
  }
});
function checkFileUpload(req, file, cb) {
  const fileTypes = /\.(jpg|jpeg|png|gif)$/;
  if (!file.originalname.match(fileTypes)) {
    return cb(new Error('Bạn chỉ được upload file ảnh'));
  }
  cb(null, true);
}
const upload = multer({ 
  storage: storage, 
  fileFilter: checkFileUpload 
});

// lấy ra tất cả các phim 
router.get('/', async function(req, res, next) {
  try {
    const phim = await Phim.find(); 
    res.json(phim);
  } catch (err) {
    next(err);
  }
});
// lấy tất cả các phim có trạng thái là 1
 router.get('/dangchieu', async function(req, res, next) {
  try {
    const phim = await Phim.find({ trangthai: 0 }); 
    res.json(phim);
  } catch (err) {
    next(err);
  }
});
// lấy tất cả các phim có  trạng thái là 0
 router.get('/sapchieu', async function(req, res, next) {
  try {
    const phim = await Phim.find({ trangthai: 1 }); 
    res.json(phim);
  } catch (err) {
    next(err);
  }
});

// upload phim 
router.post('/add', upload.single('img'), async (req, res) => {
  try {
    const {
      tenphim,
      noidung,
      thoiluong,
      daodien,
      dienvien,
      trailler,
      ngayhieuluc,
      ngayhieulucden,
      trangthai,
      theloaiIds
    } = req.body;

    // Kiểm tra nếu các trường không hợp lệ
    if (!tenphim || !noidung || !thoiluong || !daodien || !dienvien || !trailler || !ngayhieuluc || !ngayhieulucden || !trangthai || !theloaiIds) {
      return res.status(400).send({ message: 'Tất cả các trường là bắt buộc.' });
    }

    // Chắc chắn rằng theloaiIds là một mảng
    let genresArray = [];
    try {
      genresArray = JSON.parse(theloaiIds); // chuyển đổi thành mảng nếu là chuỗi
    } catch (e) {
      return res.status(400).send({ message: 'theloaiIds phải là một mảng hợp lệ.' });
    }

    const img = req.file ? req.file.originalname : null;

    const newPhim = {
      tenphim,
      noidung,
      thoiluong,
      daodien,
      dienvien,
      trailler,
      ngayhieuluc,
      ngayhieulucden,
      trangthai,
      img
    };

    // Tạo mới phim
    const result = await Phim.create(newPhim);

    // Lưu thể loại cho phim
    const phimId = result._id;
    const theloaiPromises = genresArray.map(id => PhimTheLoai.create({ phim_id: phimId, theloai_id: id }));

    await Promise.all(theloaiPromises);

    res.status(201).send(result);
  } catch (err) {
    console.error('Lỗi khi thêm phim:', err);
    res.status(500).send({ error: 'Đã có lỗi xảy ra khi thêm phim.' });
  }
});

//xóa phim
 router.delete('/:id', async (req, res) => {
  try {
    const result = await Phim.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).send('The phim with the given ID was not found.');
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
//update phim
router.put('/:id', upload.single('img'), async (req, res) => {
  try {
    const { tenphim, noidung, thoiluong, daodien, dienvien, trailler, ngayhieuluc, ngayhieulucden, trangthai } = req.body;

    const updatedData = {
      tenphim,
      noidung,
      thoiluong,
      daodien,
      dienvien,
      trailler,
      ngayhieuluc,
      ngayhieulucden,
      trangthai,
      img: req.file ? req.file.originalname : undefined, // Update img if a new file is uploaded
    };

    const phim = await Phim.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    console.log(req.body); // Kiểm tra dữ liệu được gửi đến API
    if (!phim) return res.status(404).send('The phim with the given ID was not found.');
    res.send(phim);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});



//lấy phim theo id
 router.get('/:id', async (req, res) => {
  try {
    const phim = await Phim.findById(req.params.id);
    if (!phim) return res.status(404).send('The phim with the given ID was not found.');
    res.send(phim);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

//tìm kiếm phim theo tên
 router.get('/:name', async (req, res) => {
  try {
    const phim = await Phim.find({ tenphim: new RegExp(req.params.name, 'i') });
    res.json(phim);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

//lấy phim theo thể loại
 router.get('/theloai/:id', async (req, res) => {
  try {
    const phim = await Phim.find({ theloai: req.params.id });
    res.json(phim);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
module.exports = router;