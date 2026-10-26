/* เปลี่ยนภาษา TH / EN — สำเนาจาก Push Media HR (app/web/i18n.js) ใช้ใน Workforce Task Manager (26 ต.ค. 2569) · คำเฉพาะ WTM อยู่ใน wtm-dict.js (window.WTM_DICT)
 * ต้นฉบับ: เปลี่ยนภาษา TH / EN ของหลังบ้าน (Figma 398:6868 แบบ A · 25 ต.ค. 2569)
 * แปลตอนแสดงผล: เดินทุกข้อความบนหน้า → แยกเป็นช่วงอักษรไทย → แปลช่วงที่ตรงกับพจนานุกรมทั้งช่วง (หรือทุกคำในช่วง)
 * ช่วงที่มีคำไม่รู้จัก (เช่น ชื่อคน ชื่องาน ข้อความที่ผู้ใช้กรอก) คงภาษาไทยไว้ · ข้อความเดิมเก็บไว้ในโหนด → กลับเป็นไทยได้ทันที
 * วันที่: "25 ต.ค. 2569" → "25 Oct 2026" · ภาษาที่เลือกจำใน localStorage (hr_lang) */
(function () {
  var D = {
    // ── เมนู / หัวหน้า ──
    'ภาพรวม': 'Overview', 'ศูนย์อนุมัติ': 'Approvals', 'พนักงาน': 'Employees', 'ลงเวลา': 'Attendance', 'การลา': 'Leave', 'ตารางงาน': 'Schedule',
    'องค์กรและระบบ': 'Organization & system', 'โครงสร้างองค์กร': 'Organization', 'รายงาน': 'Reports', 'ตั้งค่าระบบ': 'Settings', 'ออกจากระบบ': 'Log out',
    'เร็ว ๆ นี้': 'Coming soon', 'ย่อแถบเมนู': 'Collapse menu', 'ขยายแถบเมนู': 'Expand menu', 'ค้นหาพนักงาน หรือเมนู': 'Search employees or menus',
    'ค้นหา': 'Search', 'ช่วยเหลือ': 'Help', 'คำขอรออนุมัติ': 'Pending requests', 'ขอบเขต': 'Scope', 'ขอบเขตข้อมูล': 'Data scope', 'ขอบเขตข้อมูลที่คุณเห็น': 'Data you can see',
    'อนุมัติ': 'Approve', 'โครงสร้าง': 'Organization', 'ตั้งค่า': 'Settings', 'เมนูหลัก': 'Main menu', 'หลังบ้าน': 'Admin', 'ระบบ': 'System',
    'ภาพรวมของฉัน': 'My overview', 'ของฉัน': 'Mine', 'ข้อมูลของฉัน': 'My info', 'ข้อมูลของตัวเอง': 'Your own data',
    'ทั้งบริษัท': 'Whole company', 'ตัวเอง': 'Self', 'ทีม': 'Team', 'แผนก': 'Department', 'ทั้งหมด': 'All', 'ทั้งแผนก': 'Whole department',
    // ── บทบาท ──
    'ผู้ดูแลระบบ': 'Administrator', 'ผู้บริหาร': 'Executive', 'หัวหน้าแผนก': 'Department head', 'หัวหน้าทีม': 'Team lead', 'หัวหน้างาน': 'Supervisor',
    'ผู้จัดการ': 'Manager', 'ผู้จัดการแผนก': 'Department manager', 'บทบาท': 'Role', 'บทบาทในระบบ': 'System role', 'บทบาทและสิทธิ์': 'Roles & permissions', 'สิทธิ์ในระบบ': 'Permissions',
    'ผู้ดูแล': 'Admin', 'ผู้ทำ': 'By', 'ผู้ขอ': 'Requester', 'ผู้รับเหมา': 'Contractor', 'ทีมผู้รับเหมา': 'Contractor team',
    // ── ปุ่ม / คำทั่วไป ──
    'บันทึก': 'Save', 'ยกเลิก': 'Cancel', 'ยืนยัน': 'Confirm', 'แก้ไข': 'Edit', 'ลบ': 'Delete', 'เพิ่ม': 'Add', 'ปิด': 'Close', 'ดู': 'View', 'กด': 'Click',
    'รีเฟรช': 'Refresh', 'กำลังรีเฟรช': 'Refreshing', 'กำลังโหลด': 'Loading', 'กำลังโหลดข้อมูล': 'Loading data', 'โหลด': 'Load', 'ลองใหม่': 'Try again', 'อีกครั้ง': 'again',
    'ค้นหาตำแหน่ง': 'Search positions', 'เลือก': 'Select', 'เลือกได้': 'Selectable', 'ใช่': 'Yes', 'ไม่': 'No', 'ไม่ใช่': 'Not', 'ใหม่': 'New', 'ก่อนหน้า': 'Previous', 'ถัดไป': 'Next',
    'ดูทั้งหมด': 'View all', 'รายละเอียด': 'Details', 'ประวัติ': 'History', 'สถานะ': 'Status', 'ประเภท': 'Type', 'หมายเหตุ': 'Note', 'เหตุผล': 'Reason', 'วันที่': 'Date', 'เวลา': 'Time',
    'จาก': 'from', 'ถึง': 'to', 'ถึงวันที่': 'To date', 'คน': 'people', 'วัน': 'days', 'ครั้ง': 'times', 'นาที': 'min', 'ชม': 'h', 'วินาที': 'sec', 'ปี': 'yr', 'เดือน': 'mo', 'ใบ': 'items', 'คัน': 'vehicles', 'รายการ': 'items', 'บาท': 'THB',
    'หรือ': 'or', 'และ': 'and', 'ของ': 'of', 'โดย': 'by', 'ทุก': 'every', 'อีก': 'more', 'คุณ': 'you', 'มี': 'has', 'ได้': 'OK', 'ไม่ได้': 'cannot', 'แล้ว': 'done',
    'ทั้งหมดเดือนนี้': 'all this month', 'เดือนนี้': 'This month', 'วันนี้': 'Today', 'สัปดาห์นี้': 'This week', 'ล่าสุด': 'Latest', 'ปัจจุบัน': 'Current',
    'คัดลอก': 'Copy', 'คัดลอกแล้ว': 'Copied', 'คืนค่า': 'Reset', 'คืนค่าเดิมแล้ว': 'Restored', 'ล้างตัวกรอง': 'Clear filters', 'ล้างฟอร์ม': 'Clear form', 'ล้างสี': 'Clear color',
    'แสดง': 'Show', 'ซ่อน': 'Hide', 'แสดงเฉพาะ': 'Show only', 'เปิดใช้': 'Enable', 'ปิดใช้': 'Disable', 'เปิดใช้งาน': 'Enabled', 'ปิดใช้งาน': 'Disabled', 'ใช้งาน': 'Active', 'ไม่ใช้งาน': 'Inactive', 'ไม่ใช้งานแล้ว': 'No longer used',
    'บันทึกแล้ว': 'Saved', 'บันทึกการแก้ไข': 'Save changes', 'บันทึกการแก้ไขแล้ว': 'Changes saved', 'บันทึกไม่ได้': 'Could not save', 'ยังบันทึกไม่ได้': 'Cannot save yet', 'ยังไม่บันทึก': 'Unsaved',
    'ยังไม่ได้บันทึกการแก้ไข': 'Unsaved changes', 'บันทึกการตั้งค่า': 'Save settings', 'ทิ้งการแก้ไข': 'Discard changes', 'อยู่หน้านี้': 'Stay on this page', 'บันทึกแล้วไปต่อ': 'Save and continue',
    'มีการแก้ไข': 'Edited', 'แก้ไขแล้ว': 'Edited', 'แก้แล้ว': 'Edited', 'ลบแล้ว': 'Deleted', 'เสร็จแล้ว': 'Done', 'ดำเนินการ': 'Actions', 'ดำเนินการแล้ว': 'Processed',
    'ไม่สำเร็จ': 'Failed', 'ไม่สำเร็จ กรุณาลองใหม่': 'Failed, please try again', 'ผิดพลาด': 'Error', 'ไม่พบ': 'Not found', 'ไม่พบรายการ': 'No items found', 'ไม่มีรายการ': 'No items',
    'ไม่มีข้อมูล': 'No data', 'ยังไม่มีข้อมูล': 'No data yet', 'ยังไม่มีรายการ': 'No items yet', 'ยังไม่มี': 'None yet', 'ไม่มี': 'None', 'ว่าง': 'Empty', 'ไม่ระบุ': 'Not specified', 'ยังไม่ระบุ': 'Not specified yet',
    'ไม่ต้อง': 'Not required', 'ไม่บังคับ': 'Optional', 'ต้องกรอก': 'Required', 'กรอก': 'Enter', 'กรอกชื่อ': 'Enter a name', 'เว้นว่าง': 'Leave blank', 'ไม่จำกัด': 'Unlimited',
    'ค่าเริ่มต้น': 'Default', 'กำหนดเอง': 'Custom', 'อัตโนมัติ': 'Automatic', 'คำนวณอัตโนมัติ': 'Auto-calculated', 'โดยประมาณ': 'approx.', 'ทั้งหมดของ': 'all of',
    'เปิดหน้าต่าง': 'Open window', 'ปิดทั้งแผนก': 'Turn off department', 'เปิดทั้งแผนก': 'Turn on department', 'เลือกทั้งหน้า': 'Select page', 'ยกเลิกการเลือก': 'Deselect',
    'ก่อน': 'before', 'หลัง': 'after', 'ขึ้นไป': 'or more', 'สูงสุด': 'Max', 'ขั้นต่ำคน': 'Min staff', 'เฉลี่ย': 'Average', 'รวม': 'Total', 'ครบ': 'Complete', 'ปกติ': 'Normal',
    'หน้า': 'Page', 'หมวด': 'Category', 'เมนู': 'Menu', 'การ์ด': 'Cards', 'ตาราง': 'Table', 'มุมมอง': 'View', 'เรียงตาม': 'Sort by', 'ช่วง': 'Range', 'ช่วงเวลา': 'Period', 'รุ่น': 'Model',
    'เลขที่': 'No.', 'รหัส': 'Code', 'ชื่อ': 'Name', 'ใช้ได้': 'Valid', 'ใช้ได้บน': 'Available on', 'ไม่ถึง': 'under', 'เกิน': 'over', 'ไม่เกิน': 'up to', 'ใช้': 'Used', 'คืน': 'Return', 'คืน': 'Return',
    'รับ': 'Receive', 'ส่ง': 'Send', 'ส่งต่อ': 'Forward', 'ย้าย': 'Move', 'ข้าม': 'Skip', 'ลาก': 'Drag', 'ผูก': 'Link', 'เชื่อม': 'Connect', 'แก้': 'Edit', 'ดูอย่างเดียว': 'View only', 'อย่างเดียว': 'only',
    'ช่องทาง': 'Channel', 'เรื่อง': 'Topic', 'การกระทำ': 'Action', 'เหตุการณ์': 'Event', 'คำสั่ง': 'Command', 'คำสั่งล่าสุด': 'Recent commands', 'รายการล่าสุด': 'Recent items', 'ข้อความล่าสุด': 'Latest messages',
    'ทางลัด': 'Shortcuts', 'แนะนำ': 'Recommended', 'เช่น': 'e.g.', 'อื่น ๆ': 'Others', 'ทุกแบบ': 'all types', 'ทุกคน': 'Everyone', 'ทุกทีม': 'All teams', 'ทุกแผนก': 'All departments',
    'ทุกวัน': 'Every day', 'ทุกเดือน': 'Monthly', 'ทุกประเภท': 'All types', 'ทุกใบ': 'all requests', 'ทุกกะ': 'all shifts', 'ใช้ได้ครั้งเดียว': 'Single use', 'มีผลทันที': 'Takes effect immediately',
    'กำลังทำงาน': 'Working', 'ทำงาน': 'Working', 'ไม่ทำงาน': 'Off', 'หยุด': 'Off', 'อยู่ระหว่างพัฒนา': 'In development', 'หน้านี้ออกแบบไว้แล้วใน': 'This page is designed in',
    'จะเปิดใช้ในรอบถัดไป': 'Available in a later release', 'โหมดทดสอบ': 'Test mode', 'โหมดทดสอบในเครื่อง': 'Local test mode', 'เข้าเป็น': 'Sign in as',
    // ── เข้าสู่ระบบ ──
    'เข้าสู่ระบบ': 'Sign in', 'เข้าสู่ระบบด้วย': 'Sign in with', 'เข้าสู่ระบบเป็น': 'Signed in as', 'บัญชีพนักงาน': 'Employee account', 'รหัสผ่าน': 'Password', 'รหัสผ่านผู้ดูแลระบบ': 'Administrator password',
    'แสดงรหัสผ่าน': 'Show password', 'ซ่อนรหัสผ่าน': 'Hide password', 'ใส่ผิด': 'Wrong', 'ครั้ง ระบบพัก': 'times, locked for', 'ใช้บัญชี': 'Use account', 'ลองบัญชี': 'Try account',
    'ใช้ครั้งแรก': 'First time', 'ไม่พบอีเมลนี้ในข้อมูลพนักงาน': 'This email is not in the employee records', 'ให้เพิ่มอีเมลในข้อมูลพนักงาน': 'Ask HR to add the email to your record',
    'ใช้อีเมลเดียวกับที่ลงทะเบียนในข้อมูลพนักงาน': 'Use the same email registered in your employee record', 'ใช้ตอนตั้งค่าครั้งแรกหรือกรณีฉุกเฉิน': 'For first-time setup or emergencies',
    'ตรวจว่าเบราว์เซอร์ไม่ได้บล็อกป๊อปอัป': 'Check that the browser is not blocking pop-ups', 'หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่': 'Session expired, please sign in again',
    'เข้าใช้ไม่ได้': 'Cannot sign in', 'เข้าใช้ไม่ได้ หรือข้อมูลไม่ถูกต้อง ติดต่อ': 'Cannot sign in or data is wrong? Contact', 'โหลดระบบ': 'Loading system', 'ไม่มีสิทธิ์': 'No permission', 'ไม่มีสิทธิ์ดูข้อมูลนี้': 'You cannot view this data',
    'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้': 'Cannot reach the server', 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ': 'Server connection failed', 'อินเทอร์เน็ตหรือเซิร์ฟเวอร์สะดุดชั่วคราว': 'temporary network or server problem',
    'กรุณากดรีเฟรชอีกครั้ง': 'please press Refresh again', 'โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง': 'Could not load data, try again',
    // ── Dashboard ──
    'สวัสดี คุณ': 'Hello,', 'พนักงานทั้งหมด': 'Total employees', 'ทดลองงาน': 'Probation', 'ลาระยะยาว': 'Long leave', 'เข้างานวันนี้': 'Present today', 'มาสาย': 'Late',
    'ไม่มีคนมาสาย': 'No one late', 'ยังไม่ลงเวลา': 'Not clocked in', 'ลืมลงเวลา': 'Missed clock-out', 'ต้องตรวจสอบ': 'Needs review', 'รออนุมัติ': 'Pending', 'คำขอที่รอคุณ': 'Waiting for you',
    'อัตราเข้างาน': 'Attendance rate', 'วันล่าสุด': 'latest days', 'ลงเวลาวันนี้': "Today's attendance", 'ยังลงเวลาไม่ครบ': 'not everyone has clocked in', 'ยังไม่มีข้อมูลสรุปรายวัน': 'No daily summary yet',
    'ระบบสรุปทุกคืน': 'summarized nightly', 'ข้อมูลพนักงาน': 'Employee info', 'รวมที่รออนุมัติ': 'incl. pending', 'โหลดโควตาไม่สำเร็จ': 'Could not load quota', 'กำลังโหลดโควตาการลา': 'Loading leave quota',
    'ไม่มีคำขอรออนุมัติ': 'No pending requests', 'รายการผิดปกติวันนี้': "Today's exceptions", 'ไม่มีรายการผิดปกติวันนี้': 'No exceptions today', 'กำลังคนวันนี้ตามแผนก': "Today's staffing by department",
    'ยังไม่มีพนักงาน': 'No employees yet', 'ขอบเขตข้อมูล': 'Data scope', 'อัปเดต': 'Updated', 'คนในทีม': 'Team members', 'คนในแผนก': 'Department members', 'รอคุณอนุมัติ': 'Awaiting your approval',
    'คำขอของ': 'requests from', 'ทีมวันนี้': 'Team today', 'งานของทีมวันนี้': "Team's jobs today", 'ไม่มีงานในตารางวันนี้': 'No scheduled jobs today', 'ลาของทีม': 'Team leave', 'วันข้างหน้า': 'days ahead',
    'ไม่มีคนลาใน': 'No leave in the next', 'แยกตามทีม': 'By team', 'ต้องติดตามวันนี้': 'Follow up today', 'ไม่มีรายการต้องติดตาม': 'Nothing to follow up', 'ลงเวลาครบ': 'All clocked in', 'ต้องติดตาม': 'Follow up',
    'พิจารณา': 'Review', 'ไม่มีคำขอรอคุณ': 'No requests for you', 'เข้างาน': 'Present', 'เข้า': 'In', 'ออก': 'Out', 'สาย': 'Late', 'ลา': 'Leave', 'กะดึก': 'Night shift', 'ต่างจังหวัด': 'Upcountry',
    'หน้างาน': 'On site', 'ยืมจากทีม': 'Borrowed from team', 'วันหยุดถัดไป': 'Next holiday', 'ยังไม่มีวันหยุดถัดไป': 'No upcoming holiday',
    // ── พนักงาน ──
    'รายชื่อ': 'List', 'เพิ่มพนักงาน': 'Add employee', 'เพิ่มพนักงานแล้ว': 'Employee added', 'บันทึกพนักงาน': 'Save employee', 'แก้ข้อมูลพนักงาน': 'Edit employee', 'แก้ไขข้อมูล': 'Edit info',
    'ไม่พบพนักงาน': 'No employees found', 'ไม่พบพนักงานตามเงื่อนไขนี้': 'No employees match these filters', 'เลือกพนักงาน': 'Select employee', 'รหัสพนักงาน': 'Employee code',
    'คำนำหน้า': 'Title', 'นาย': 'Mr.', 'นาง': 'Mrs.', 'นางสาว': 'Ms.', 'นามสกุล': 'Last name', 'ชื่อเล่น': 'Nickname', 'ชื่อภาษาอังกฤษ': 'English name', 'เพศ': 'Gender', 'ชาย': 'Male', 'หญิง': 'Female',
    'วันเกิด': 'Birth date', 'อายุ': 'Age', 'สถานภาพ': 'Marital status', 'โสด': 'Single', 'สมรส': 'Married', 'หย่าร้าง': 'Divorced', 'หม้าย': 'Widowed', 'มือถือ': 'Mobile', 'เบอร์มือถือ': 'Mobile number', 'อีเมล': 'Email',
    'ตำแหน่ง': 'Position', 'ตำแหน่งงาน': 'Job position', 'ชื่อตำแหน่ง': 'Position name', 'ไม่พบตำแหน่ง': 'Position not found', 'วันเริ่มงาน': 'Start date', 'ประเภทพนักงาน': 'Employment type',
    'รายเดือน': 'Monthly', 'รายวัน': 'Daily', 'ลาออก': 'Resigned', 'ไม่รวมลาออก': 'Excluding resigned', 'ลาล่วงหน้า': 'Upcoming leave', 'ทุกช่วงเวลา': 'All dates', 'สัปดาห์ที่แล้ว': 'Last week', 'เดือนที่แล้ว': 'Last month', '30 วันล่าสุด': 'Last 30 days', 'วันเริ่ม': 'Start', 'เลือกวันสุดท้าย': 'Pick end date', 'เมื่อวาน': 'Yesterday', 'ตกลง': 'Apply', 'เลือกช่วงวัน': 'Select date range', 'ทั้งหมด (รวมลาออก)': 'All (incl. resigned)', 'ดูได้ที่ตัวกรองสถานะ': 'see the status filter', 'ทำงานวันเสาร์': 'Works Saturdays', 'โปรไฟล์': 'Profile', 'กลับไปโปรไฟล์': 'Back to profile', 'กลับไปรายชื่อพนักงาน': 'Back to employee list',
    'ดูข้อมูลพนักงาน': 'View employee', 'รูปโปรไฟล์': 'Profile photo', 'เปลี่ยนรูป': 'Change photo', 'ลบรูป': 'Remove photo', 'ข้อมูลส่วนตัว': 'Personal info', 'ข้อมูลอ่อนไหว': 'Sensitive data',
    'ข้อมูลเพิ่มเติมและที่อยู่': 'Additional info & address', 'แก้ไขข้อมูลเพิ่มเติม': 'Edit additional info', 'ที่อยู่': 'Address', 'ที่อยู่ตามบัตร': 'ID card address', 'ที่อยู่ตามบัตรประชาชน': 'ID card address',
    'ที่อยู่ปัจจุบัน': 'Current address', 'เหมือนที่อยู่ตามบัตรประชาชน': 'Same as ID card address', 'เหมือนด้านบน': 'Same as above', 'การฝึกอบรม': 'Training', 'หลักสูตร': 'Course', 'ชื่อหลักสูตร': 'Course name',
    'สินทรัพย์': 'Assets', 'สินทรัพย์ถือครอง': 'Assets held', 'ชื่อสินทรัพย์': 'Asset name', 'ถือครอง': 'Holding', 'ยังถือครอง': 'Still held', 'คืนแล้ว': 'Returned', 'วันที่รับ': 'Received', 'วันที่คืน': 'Returned on',
    'การรับ': 'Receive', 'หมายเลขเครื่อง': 'Serial no.', 'เงินเดือน': 'Salary', 'เงินเดือนและบัญชี': 'Salary & bank', 'ธนาคาร': 'Bank', 'บัญชี': 'Account', 'ชื่อบัญชี': 'Account name', 'เลขบัญชี': 'Account no.',
    'เลขบัญชีธนาคาร': 'Bank account no.', 'ดูเลขบัญชี': 'Show account no.', 'เปิดดูเลขบัญชี': 'Reveal account no.', 'เลขบัญชีเห็นเฉพาะ': 'Account no. visible only to', 'การเปิดดูเลขบัญชีถูกบันทึกใน': 'Viewing account numbers is logged in',
    'กสิกรไทย': 'Kasikornbank', 'กรุงเทพ': 'Bangkok Bank', 'กรุงไทย': 'Krungthai', 'ไทยพาณิชย์': 'SCB', 'กรุงศรีอยุธยา': 'Krungsri', 'ทหารไทยธนชาต': 'ttb',
    'รหัสสแกนนิ้ว': 'Fingerprint ID', 'ระบบลงเวลาเดิม': 'Legacy attendance system', 'เก็บรหัสพนักงานของแต่ละระบบไว้ที่หน้าพนักงานแล้ว': 'Each system’s employee code is kept on the employee page',
    'ประวัติแก้ไข': 'Edit history', 'เหตุผลการแก้ไข': 'Reason for change', 'ไม่รวมบทบาท สถานะ ธนาคาร': 'excluding role, status, bank', 'เช่น พนักงานเปลี่ยนบัญชี': 'e.g. employee changed account',
    'ตรวจช่องสีแดง': 'Check the red fields', 'ช่องที่ขึ้นสีแดง': 'Fields in red', 'กรอกผิด': 'Invalid', 'รหัสเปลี่ยนไม่ได้หลังสร้าง': 'Code cannot change after creation', 'ระบบเสนอเลขถัดไปให้ แก้ได้': 'Next number suggested, editable',
    'ค้นหา ชื่อ ชื่อเล่น รหัส ทีม ตำแหน่ง เบอร์ อีเมล': 'Search name, nickname, code, team, position, phone, email', 'ค้นหา ชื่อ': 'Search name', 'คนที่': 'No.',
    'ช่องค้นหาด้านบนพิมพ์ชื่อ ชื่อเล่น หรือรหัสพนักงาน เพื่อเปิดโปรไฟล์ได้ทันที': 'Type a name, nickname or code in the search box to open a profile',
    'คุณเห็นเฉพาะข้อมูลของตัวเอง': 'You only see your own data', 'สิทธิ์แก้ข้อมูลขึ้นกับที่': 'Edit rights depend on', 'แก้ข้อมูลพนักงานได้เฉพาะ': 'Only these can edit employees:',
    'ดูข้อมูลได้ตามขอบเขตที่': 'You see data within the scope set by', 'ตั้งที่หน้าพนักงาน': 'Set on the employee page',
    // ── LINE ──
    'เชื่อมบัญชี': 'Link account', 'เชื่อมแล้ว': 'Linked', 'ยังไม่เชื่อม': 'Not linked', 'ยังไม่ผูก': 'Not linked', 'เชื่อมเมื่อ': 'Linked on', 'ยกเลิกเชื่อม': 'Unlink', 'ยกเลิกการเชื่อม': 'Unlink',
    'คำขอเชื่อม': 'Link requests', 'มีคำขอเชื่อม': 'Link requests pending', 'ยืนยันการเชื่อม': 'Confirm link', 'ส่งลิงก์เชื่อม': 'Send link', 'ลิงก์เชิญ': 'Invite link', 'ลิงก์เชิญเชื่อม': 'Invite link',
    'ไม่มีลิงก์เชิญ': 'No invite link', 'ลิงก์ใช้ได้ถึง': 'Link valid until', 'กำลังสร้างลิงก์': 'Creating link', 'คัดลอกลิงก์แล้ว': 'Link copied', 'ไม่มีคำขอรอยืนยัน': 'No pending confirmations',
    'รอยืนยัน': 'Awaiting confirmation', 'ไม่ใช่คนนี้': 'Not this person', 'ยืนยันว่าเป็นพนักงานคนนี้': 'Confirm this is the employee', 'ตรวจว่าเป็นคนเดียวกันก่อนยืนยัน': 'Make sure it is the same person',
    'ใช้ยืนยันตัวตนตอนเชื่อม': 'Used to verify identity when linking', 'บันทึกแล้วส่งลิงก์เชื่อม': 'Save and send link', 'เปิดแอปพนักงานใน': 'Open the employee app in',
    'พนักงานจะใช้แอปไม่ได้จนกว่าจะเชื่อมใหม่': 'The employee cannot use the app until linked again', 'ลิงก์เก่าของคนเดียวกันถูกยกเลิกอัตโนมัติ': 'Older links for this person are revoked',
    'พนักงานที่ลงทะเบียนเองโดยไม่ผ่านลิงก์เชิญ': 'Employees who registered without an invite link', 'ระบบผูกบัญชีให้ทันที แล้วเปิดแอปได้เลย': 'The account is linked immediately',
    'แอปพนักงาน': 'Employee app', 'เดียวกับแอป': 'same as the app', 'พนักงานเข้าแอปได้': 'Employee can use the app', 'ยังลงเวลาและยื่นคำขอผ่านแอปไม่ได้': 'cannot clock in or submit requests in the app yet',
    'ยังไม่ได้ลงทะเบียน': 'Not registered', 'นี้ยังไม่ได้เชื่อมกับพนักงาน ให้เปิดลิงก์เชื่อม': 'is not linked to an employee; open the link',
    // ── ลงเวลา ──
    'แก้เวลา': 'Edit time', 'ลงแทน': 'Clock for', 'แก้เวลา / ลงแทน': 'Edit time / clock for', 'ย้ายเข้าแท็บเดือน': 'Move to month tab', 'สรุปตอนนี้': 'Summarize now', 'ย้ายเข้าแท็บเดือน + สรุปตอนนี้': 'Move to month tab + summarize now',
    'ลงเวลาแล้ว': 'Clocked in', 'เข้างานแล้ว': 'Clocked in', 'ไม่มีการลงเวลาในวันนี้': 'No attendance today', 'ยังไม่เคยลงเวลา': 'Never clocked in', 'ลงเวลาไม่ครบ': 'Incomplete', 'ไม่มีลงเวลาออก': 'No clock-out', 'ไม่มีลงเวลาเข้า': 'No clock-in',
    'เวลาเข้า': 'Clock-in', 'เวลาออก': 'Clock-out', 'เวลาเข้างาน': 'Start time', 'เวลาเลิกงาน': 'End time', 'เวลาผิดปกติ': 'Irregular time', 'ขาดงาน': 'Absent', 'นอกพื้นที่': 'Outside area', 'สถานที่': 'Location',
    'ลงเวลาเข้าแทน': 'Clock in for', 'ลงเวลาออกแทน': 'Clock out for', 'ลงเวลาแทน': 'Clock for', 'แก้ไขเวลา': 'Edit time', 'บันทึกเวลา': 'Save time', 'ใส่เวลา': 'Enter time', 'แก้เวลาลงงาน': 'Edit clock time',
    'เวลาออกน้อยกว่าเวลาเข้า': 'Clock-out is earlier than clock-in', 'ประวัติการแก้ของวันนี้': "Today's edit history", 'ยกเลิกรายการ': 'Void entry', 'ยกเลิกรายการแล้ว': 'Entry voided', 'รายการที่ยกเลิกยังเก็บไว้': 'Voided entries are kept',
    'แก้เวลา ลงเวลาแทน หรือยกเลิกรายการที่ผิด': 'Edit time, clock for someone, or void a wrong entry', 'เช่น กดผิด ลงเวลาซ้ำ': 'e.g. wrong tap, duplicate', 'เช่น ลืมลงเวลา โทรศัพท์เสีย': 'e.g. forgot, phone broken',
    'เลือกพนักงานและวันที่': 'Select employee and date', 'ไม่มีการลบข้อมูล': 'Nothing is deleted', 'ทุกการแก้บันทึกใน': 'Every edit is logged in', 'ทุกการแก้ไขบันทึกใน': 'Every edit is logged in',
    'วันก่อนหน้า ระบบคำนวณสรุปของวันนั้นใหม่ทันที': 'For past days the summary is recalculated immediately', 'ปกติระบบทำเองตอน': 'Normally runs automatically at',
    'รายการเข้าแท็บเดือน': 'entries to the month tab', 'สรุปแล้ว': 'Summarized', 'อุปกรณ์ลงเวลา': 'Clock-in devices', 'อุปกรณ์ที่ใช้ลงเวลา': 'Devices used to clock in', 'อุปกรณ์ใหม่': 'New device', 'เครื่องใหม่': 'New device',
    'จำเครื่อง': 'Remember device', 'อนุญาตเครื่องนี้': 'Allow this device', 'อนุญาตอุปกรณ์แล้ว': 'Device allowed', 'ไม่อนุญาตอุปกรณ์': 'Block device', 'ยกเลิกอุปกรณ์แล้ว': 'Device revoked', 'ลงเวลาจากเครื่องนี้ไม่ได้อีก': 'can no longer clock in from this device',
    'ระบบจำเครื่องแรกของแต่ละคนอัตโนมัติ': 'The first device of each person is remembered automatically', 'เครื่องแรกที่ลงเวลาจะถูกจดจำอัตโนมัติ': 'The first device used is remembered automatically',
    'เครื่องใหม่ต้องให้': 'New devices need', 'แจ้งเมื่อใช้เครื่องใหม่': 'Notify on new device', 'เปลี่ยนมือถือหรือติดตั้ง': 'Changed phone or reinstalled', 'จุดลงเวลา': 'Check-in points', 'จุดลงเวลาที่อนุญาต': 'Allowed check-in points',
    'ชื่อจุด': 'Point name', 'รัศมี': 'Radius', 'เมตร': 'm', 'ละติจูด': 'Latitude', 'ลองจิจูด': 'Longitude', 'ตัวเลขแรกคือละติจูด': 'The first number is latitude', 'คลิกขวาที่จุด': 'Right-click the spot',
    'คัดลอกพิกัดจาก': 'Copy coordinates from', 'ใช้ตรวจพิกัดตอนลงเวลา': 'Used to check location when clocking in', 'รัศมีลงเวลาที่หน้างาน': 'On-site check-in radius', 'เมื่องานไม่ได้กำหนดรัศมีเอง': 'when a job has no radius',
    'ประเภทลงเวลา': 'Check-in type', 'ประเภทการลงเวลา': 'Check-in type', 'ไม่ต้องลงเวลา': 'No check-in required', 'ยกเว้นการลงเวลา': 'Exempt from check-in', 'ลงเวลาเฉพาะจุดสำนักงาน': 'Office points only',
    'ลงเวลาที่หน้างานตามตารางงาน': 'On site per schedule', 'สำนักงาน หรือหน้างานตามตาราง': 'Office or scheduled site', 'ยังไม่ระบุการลงเวลา': 'Check-in not set', 'การลงเวลา': 'Attendance', 'ดูการลงเวลา': 'View attendance',
    'เพิ่มจุดใหม่ได้ที่ โครงสร้าง': 'Add points in Organization', 'แต่ต้องดูการลงเวลาทั้งแผนก': 'but needs the whole department attendance',
    // ── กะ / เวลาทำงาน ──
    'เวลาทำงาน': 'Working hours', 'เวลาทำงานรายคน': 'Per-person hours', 'เวลาทำงานและเกณฑ์สาย': 'Working hours & late rules', 'เวลาทำงานและการลงเวลา': 'Working hours & attendance', 'วันทำงาน': 'Workdays',
    'กะ': 'Shift', 'กะเช้า': 'Morning shift', 'กะเดียว': 'Single shift', 'กะประจำ': 'Default shift', 'กะการทำงาน': 'Shifts', 'กะการทำงานของพนักงาน': 'Employee shifts', 'บันทึกกะ': 'Save shift', 'บันทึกกะแล้ว': 'Shift saved',
    'ตั้งกะเฉพาะคน': 'Per-person shifts', 'เลือกได้ทุกกะ': 'Any shift', 'เลือกได้เฉพาะกะที่ติ๊ก': 'Only ticked shifts', 'เลือกตอนลงเวลา': 'Choose when clocking in', 'ลงเวลาแบบเลือกกะ': 'Shift selection at clock-in',
    'ไม่แสดงแถบเลือกกะ': 'No shift picker', 'ใช้กะนี้อัตโนมัติ': 'Use this shift automatically', 'ไม่แสดงแถบเลือกกะ ใช้กะนั้นเลย': 'No shift picker, uses that shift', 'เลือกกะที่ไม่ใช่กะประจำ': 'Choosing a non-default shift',
    'พนักงานทุกคนเลือกกะตอนลงเวลาเข้า': 'Everyone picks a shift when clocking in', 'กำหนดกะเฉพาะคนได้ที่ หน้าพนักงาน': 'Set per-person shifts on the employee page', 'กลับก่อนตามกะที่เลือก': 'leaves early per the chosen shift',
    'ค่าตอนนี้เป็นค่าชั่วคราว รอยืนยันเงื่อนไข': 'Current values are temporary pending confirmation', 'ข้ามวัน': 'Overnight', 'ข้ามเที่ยงคืน': 'Past midnight', 'กลางวัน': 'Day',
    'คิดสาย': 'Late rule', 'สายหลัง': 'Late after', 'สายรวม': 'Total late', 'นับสายหลังเวลา': 'Late after', 'นับสายเมื่อเกิน': 'Late when over', 'เริ่มนับสาย': 'Late from', 'ผ่อนผันสาย': 'Grace period',
    'เวลายืดหยุ่น ไม่นับสาย': 'Flexible, never late', 'ยืดหยุ่น': 'Flexible', 'ตามเวลาเข้างานในโปรไฟล์': 'per profile start time', 'เวลาเข้างานค่าเริ่มต้น': 'Default start time', 'เวลาเลิกงานค่าเริ่มต้น': 'Default end time',
    'ค่าเริ่มต้นของพนักงานใหม่และเกณฑ์นับสาย': 'Defaults for new employees and late rules', 'ใช้กับพนักงานใหม่': 'Applies to new employees', 'เวลาเฉพาะคนตั้งที่หน้าพนักงาน': 'Per-person times are set on the employee page',
    'เช่น กะดึก หรือเวลายืดหยุ่น': 'e.g. night shift or flexible', 'เช่น ปรับเวลาทำงานตามประกาศ': 'e.g. hours changed by announcement', 'ออก เกณฑ์สาย กะ': 'out, late rules, shifts',
    // ── การลา ──
    'คำขอลา': 'Leave requests', 'ใบลา': 'Leave request', 'วันลา': 'Leave days', 'ลาเช้า': 'Morning leave', 'ลาบ่าย': 'Afternoon leave', 'ลาครึ่งวัน': 'Half-day leave', 'ครึ่งวัน': 'Half day', 'เต็มวัน': 'Full day',
    'ครึ่งเช้า': 'Morning half', 'ครึ่งบ่าย': 'Afternoon half', 'ลาป่วย': 'Sick leave', 'ลากิจ': 'Personal leave', 'ลาพักร้อน': 'Annual leave', 'พักร้อน': 'Annual', 'ป่วย': 'Sick', 'กิจ': 'Personal', 'ลาได้': 'Can take leave', 'ไม่ให้ลา': 'No leave allowed',
    'โควตา': 'Quota', 'โควตาการลา': 'Leave quota', 'โควตาต่อปี': 'Yearly quota', 'ต่อปี': 'per year', 'คืนโควตา': 'Restore quota', 'เกินโควตา': 'Over quota', 'เมื่อเกินโควตา': 'When over quota', 'ไม่ให้ลาเกินโควตา': 'No leave over quota',
    'ไม่มีโควตาการลา': 'No leave quota', 'โควตา ของคุณ': 'Your quota', 'ประเภทการลา': 'Leave types', 'ประเภทการลาและโควตา': 'Leave types & quotas', 'เพิ่มประเภท': 'Add type', 'เพิ่มประเภทการลา': 'Add leave type',
    'แก้ไขประเภทการลา': 'Edit leave type', 'บันทึกประเภทการลาแล้ว': 'Leave type saved', 'ชื่อประเภท': 'Type name', 'ประเภทนี้': 'this type', 'ไม่มีประเภทการลา': 'No leave types', 'ไม่รับค่าจ้าง': 'Unpaid',
    'ยื่นล่วงหน้า': 'Advance notice', 'ต้องยื่นล่วงหน้า': 'Advance notice required', 'ยื่นย้อนหลังได้': 'Back-dating allowed', 'ย้อนหลังได้': 'back-dated up to', 'ยื่นเมื่อ': 'Submitted', 'ส่งเมื่อ': 'Sent',
    'ใบแพทย์ตั้งแต่': 'Medical cert. from', 'ต้องมีใบแพทย์เมื่อลาตั้งแต่': 'Medical certificate required from', 'วันต่อใบ': 'days per request', 'ดูการลา': 'View leave', 'การอนุมัติวันลา': 'Leave approval',
    'แก้ไขเงื่อนไขการลา': 'Edit leave rules', 'มีผลกับคำขอใหม่': 'Applies to new requests', 'คำขอที่อนุมัติแล้วไม่เปลี่ยน': 'Approved requests do not change', 'เดือนเริ่มรอบปีโควตาลา': 'Quota year starts in',
    'ปัจจุบันระบบคิดโควตาตามปีปฏิทิน': 'Quota currently follows the calendar year', 'ประเภทลา โควตา ขั้นอนุมัติ': 'Leave types, quotas, approval steps', 'ประเภทการลา โควตาต่อปี และขั้นอนุมัติ': 'Leave types, yearly quota and approvals',
    'ขอยกเลิก': 'Cancellation requested', 'ขอยกเลิกวันลาที่อนุมัติแล้ว': 'Request to cancel approved leave', 'ยืนยันยกเลิก': 'Confirm cancel', 'ไม่ยกเลิก': 'Keep', 'ยกเลิกแล้ว': 'Cancelled', 'ยกเลิกโดย': 'Cancelled by',
    'อนุมัติการยกเลิก': 'Approve cancellation', 'ใบลาของทีม': 'Team leave',
    // ── อนุมัติ ──
    'อนุมัติแล้ว': 'Approved', 'ไม่อนุมัติ': 'Reject', 'ไม่อนุมัติแล้ว': 'Rejected', 'ยืนยันไม่อนุมัติ': 'Confirm rejection', 'ส่งกลับ': 'Return', 'ส่งกลับแก้ไข': 'Return for edits', 'ส่งกลับแก้ไขแล้ว': 'Returned for edits',
    'ปฏิเสธ': 'Reject', 'ปฏิเสธคำขอแล้ว': 'Request rejected', 'รับทราบ': 'Acknowledge', 'รับทราบแล้ว': 'Acknowledged', 'รับทราบอย่างเดียว': 'Acknowledge only', 'รอหัวหน้า': 'Waiting for lead',
    'อนุมัติบางวัน': 'Approve some days', 'อนุมัติคำขอ': 'Approve requests', 'อนุมัติคำขอของทีม': "Approve team's requests", 'อนุมัติขั้น': 'Approval step', 'ขั้นหัวหน้า': 'Lead step', 'ต้องอนุมัติ': 'Approval required',
    'ต้องอนุมัติอีกขั้น': 'Needs another approval', 'หลังหัวหน้าอนุมัติ': 'after the lead approves', 'หลังอนุมัติ': 'after approval', 'อนุมัติก่อน': 'Approve first', 'ขั้นตอน': 'Steps', 'ขั้นตอนอนุมัติคำขอ': 'Request approval steps',
    'ขั้น': 'Step', 'ลำดับการอนุมัติตามค่าที่ตั้งไว้ตอนนี้': 'Approval order uses current settings', 'ตามค่าที่ตั้งไว้ตอนนี้': 'per current settings', 'คุณเป็นผู้อนุมัติในฐานะ': 'You approve as',
    'จำเป็นเมื่อไม่อนุมัติ': 'Required when rejecting', 'กรอกเหตุผลก่อน': 'Enter a reason first', 'ระบุเหตุผล': 'Give a reason', 'พร้อมเหตุผล': 'with reason', 'ผู้ขอจะเห็น': 'The requester will see', 'รอคุณพิจารณา': 'Awaiting your review',
    'คำขอ': 'Requests', 'ประเภทคำขอ': 'Request type', 'คำขอทุกประเภทรวมไว้ที่นี่': 'All requests in one place', 'ไปที่คำขอ': 'Go to request', 'ไม่มีคำขอรอคุณอนุมัติ': 'No requests awaiting you',
    // ── ตารางงาน ──
    'งาน': 'Job', 'ชื่องาน': 'Job name', 'เพิ่มงาน': 'Add job', 'แก้ไขงาน': 'Edit job', 'ลบงาน': 'Delete job', 'ลบงานแล้ว': 'Job deleted', 'บันทึกงาน': 'Save job', 'รายละเอียดงาน': 'Job details', 'รายละเอียดหน้างาน': 'Site details',
    'มีงาน': 'Has job', 'ไม่มีงาน': 'No jobs', 'งานหลายวัน': 'Multi-day job', 'งานต่างจังหวัด': 'Upcountry job', 'จัดตารางงาน': 'Schedule work', 'เปิดตารางงาน': 'Open schedule', 'หน้าตารางงาน': 'Schedule page',
    'อัปเดตตารางงาน': 'Update schedule', 'เปลี่ยนตารางงาน': 'Change schedule', 'ตามตารางงาน': 'per schedule', 'ในตารางงาน': 'in the schedule', 'ในตารางงานแล้ว': 'already in the schedule', 'คืนงานในตาราง': 'Return jobs in the schedule',
    'แสดงในตารางงาน': 'Show in schedule', 'ไม่แสดงในตารางงาน': 'Hidden from schedule', 'ทีมที่แสดง': 'Visible teams', 'ทีมที่แสดงในตารางงาน': 'Teams shown in schedule', 'เปิดเฉพาะทีมที่ลงตารางงาน': 'Enable only teams that are scheduled',
    'ทีมปิดใช้งาน ไม่แสดงในตารางงาน': 'Team disabled, hidden from schedule', 'ทีมที่ปิดใช้งานในโครงสร้างองค์กรจะไม่แสดงเสมอ': 'Teams disabled in Organization are always hidden',
    'ใช้กับหน้าตารางงานของทุกคน': 'Applies to everyone’s schedule', 'ตารางงานใช้ค่าใหม่เมื่อเปิดหน้าอีกครั้ง': 'The schedule uses new values after reopening', 'ผู้ใช้ที่เปิดหลังบ้านอยู่ เห็นผลเมื่อโหลดหน้าใหม่': 'Users see changes after reloading',
    'สีตำแหน่ง': 'Position colors', 'สีตำแหน่งงาน': 'Position colors', 'สีพื้น': 'Background', 'ไม่มีสี': 'No color', 'ตั้งสีแล้ว': 'Colored', 'กำหนดสีเอง': 'Custom color', 'ไม่มีให้เลือกในจานสี': 'not in the palette',
    'สีพื้นช่องพนักงานในตารางงานตามตำแหน่ง ช่วยให้เห็นบทบาทในทีมได้เร็ว': 'Cell background by position helps spot roles quickly', 'สีนี้สงวนไว้สำหรับคนยืมตัว': 'This color is reserved for borrowed staff',
    'คนยืมตัวจากทีมอื่นใช้สีส้มเสมอ': 'Borrowed staff are always orange', 'คนยืมตัวจากทีมอื่น': 'Staff borrowed from other teams', 'สงวนไว้': 'Reserved', 'สงวนไว้สำหรับ': 'Reserved for', 'แสดงในช่องคนสีม่วง': 'shown in purple',
    'ตัวอย่างในตาราง': 'Preview', 'เขียว': 'Green', 'ฟ้า': 'Blue', 'เทา': 'Gray', 'ชมพู': 'Pink', 'ม่วง': 'Purple', 'เหลือง': 'Yellow', 'สีส้ม': 'Orange', 'สี': 'Color',
    'ค่าเบี้ย': 'Allowance', 'ค่าเบี้ยงาน': 'Job allowance', 'ค่าเบี้ยวันหยุด': 'Holiday allowance', 'ค่าเบี้ยต่างจังหวัด': 'Upcountry allowance', 'ต่างจังหวัดไม่เกินอย่างละ': 'upcountry, at most once each',
    'ครั้งต่อวัน แม้อยู่หลายงาน': 'per day, even across jobs', 'คนเดียวกันได้ค่าวันหยุด': 'the same person gets the holiday allowance', 'ทำงานวันอาทิตย์หรือวันหยุดบริษัท': 'working Sundays or company holidays',
    'ใช้คิดค่าเบี้ยวันหยุดในตารางงาน': 'used for holiday allowances in the schedule', 'ค่าใช้จ่าย': 'Costs', 'ค่าใช้จ่ายอื่น': 'Other costs', 'ค่าทางด่วน ฯลฯ': 'tolls, etc.', 'ค่าแรง ค่ารถ และ': 'wages, vehicles and',
    'ค่าจ้างรวม ฿': 'Total wages ฿', 'ค่าจ้างคิดครั้งเดียวในวันแรกของงาน': 'Wages are charged once on the first day', 'คิดวันแรกของงาน': 'charged on the first day', 'ตัวเลขในตารางหักส่วนนี้แล้ว': 'Table figures already exclude this',
    'จ้าง': 'Hired', 'จ้างรายวัน': 'Daily hire', 'เพิ่มคนจ้างรายวัน': 'Add daily worker', 'คนต่อวัน': 'people/day', 'จำนวนคน': 'Headcount', 'คนชุดหลัก': 'Main crew', 'ใช้ชุดหลัก': 'Use main crew',
    'วันที่คนต่างจากชุดหลัก': 'Days with a different crew', 'กำลังแก้คนเฉพาะ': 'Editing crew for', 'เลือกวันเพื่อเปลี่ยนคนเฉพาะวันนั้น': 'Pick a day to change its crew', 'คนที่ไปงาน': 'Crew', 'ยังไม่มีคน': 'No crew yet',
    'คนแล้ว': 'people already', 'เอาออก': 'Remove', 'ยืมจากแผนกอื่น': 'Borrowed from another department', 'ทีมนี้': 'This team', 'คนในทีมเดียวกัน': 'Same team', 'แผนกเดียวกัน': 'Same department', 'ทุกทีมในแผนกเดียวกัน': 'All teams in the department',
    'รถ': 'Vehicle', 'รถบริษัท': 'Company vehicles', 'เพิ่มรถ': 'Add vehicle', 'แก้ไขรถ': 'Edit vehicle', 'บันทึกรถแล้ว': 'Vehicle saved', 'ยังไม่มีรถ': 'No vehicles', 'ยังไม่มีรถในระบบ': 'No vehicles yet', 'ทะเบียน': 'Plate',
    'ทะเบียน รุ่น แผนกที่ใช้': 'Plate, model, department', 'แผนกที่ใช้': 'Department', 'คนและรถ': 'People & vehicles', 'เปลี่ยนคนรายวันได้ที่หมวด คนและรถ': 'Change daily crew under People & vehicles',
    'เลขโครงการ': 'Project no.', 'โครงการ': 'Project', 'บางวันอาจต้องเลื่อน': 'Some days may need to move', 'ตรวจและแก้วันที่ก่อนบันทึก': 'Check dates before saving', 'ลบทุกวันในช่วงนี้': 'Deletes every day in this range',
    'กรองตามทีม': 'Filter by team', 'รายชื่อทีม': 'Team list', 'ชื่อทีม': 'Team name', 'ไม่ระบุแผนก': 'No department', 'อยู่ในแผนก': 'In department', 'ไม่มีหัวหน้า': 'No lead',
    // ── โครงสร้าง / ตั้งค่า ──
    'ชื่อแผนก': 'Department name', 'เพิ่มแผนกแรก': 'Add the first department', 'ยังไม่มีแผนกในระบบ': 'No departments yet', 'ใช้ในฟอร์มพนักงาน': 'Used in the employee form', 'ใช้ในเอกสาร': 'Used in documents',
    'ปิดใช้งานแทนการลบ เพื่อไม่ให้ข้อมูลเดิมเสีย': 'Disable instead of deleting to keep history', 'ปิดใช้งานในโครงสร้างองค์กร': 'Disabled in Organization', 'มีประวัติใน': 'has history in', 'ประวัติเดิมยังอยู่ครบ': 'History is kept',
    'ข้อมูลบริษัท': 'Company info', 'ชื่อบริษัท': 'Company name', 'ชื่อระบบ': 'System name', 'โลโก้บริษัท': 'Company logo', 'อัปโหลดโลโก้': 'Upload logo', 'กำลังอัปโหลดโลโก้': 'Uploading logo', 'เปลี่ยนโลโก้แล้ว': 'Logo changed',
    'ใช้โลโก้มาตรฐาน': 'Use default logo', 'ใช้โลโก้ที่อัปโหลด': 'Using uploaded logo', 'กลับไปใช้โลโก้มาตรฐานแล้ว': 'Reverted to default logo', 'พื้นโปร่งใส ขนาดสี่เหลี่ยม': 'transparent, square', 'ระบบย่อเหลือไม่เกิน': 'resized to at most',
    'เปิดไฟล์รูปนี้ไม่ได้': 'Cannot open this image', 'ที่อยู่บริษัท': 'Company address', 'เบอร์โทรบริษัท': 'Company phone', 'อีเมลบริษัท': 'Company email', 'อีเมลติดต่อ': 'Contact email', 'เว็บไซต์': 'Website',
    'เลขประจำตัวผู้เสียภาษี': 'Tax ID', 'ติดต่อ': 'Contact', 'ชื่อระบบ โลโก้ ข้อมูลติดต่อ': 'System name, logo, contacts', 'แสดงบนเมนูและหน้าเข้าสู่ระบบ': 'Shown on the menu and sign-in page',
    'แสดงบนเมนูหลังบ้าน หน้าเข้าสู่ระบบ และแอปพนักงานใน': 'Shown on the admin menu, sign-in page and employee app in', 'ข้อมูลที่แสดงบนหน้าเข้าสู่ระบบ เมนู และแอปพนักงาน': 'Info shown on sign-in, menu and employee app',
    'พนักงานเห็นในแอปเมื่อต้องติดต่อ': 'Employees see this when they need to contact', 'พนักงานจะเห็นข้อความนี้': 'Employees will see this text', 'พนักงานเห็นในแอปทันที': 'Employees see it in the app immediately',
    'หมวดการตั้งค่า': 'Setting categories', 'แต่ละบทบาททำอะไรได้บ้าง': 'What each role can do', 'ขอบเขตการเห็นและแก้ข้อมูลตามบทบาท': 'Visibility and edit scope by role', 'กำหนดว่าแต่ละบทบาทเห็นและแก้ข้อมูลของใครในหลังบ้าน': 'Set whose data each role can see and edit',
    'เห็นและแก้ข้อมูลทุกคน': 'Sees and edits everyone', 'เห็นเฉพาะ': 'Sees only', 'ตามบทบาท': 'by role', 'ข้อยกเว้นรายคน': 'Per-person exceptions', 'เพิ่มข้อยกเว้น': 'Add exception', 'เพิ่มข้อยกเว้นรายคน': 'Add per-person exception',
    'แก้ไขข้อยกเว้น': 'Edit exception', 'ลบข้อยกเว้น': 'Remove exception', 'ลบข้อยกเว้นแล้ว': 'Exception removed', 'บันทึกข้อยกเว้นแล้ว': 'Exception saved', 'ยังไม่มีข้อยกเว้น': 'No exceptions',
    'ให้บางคนเห็นหรือแก้ต่างจากบทบาท เช่น เลขาเป็น': 'Let someone see or edit beyond their role, e.g. a secretary as', 'เลือกเฉพาะเรื่องที่ต่างจากบทบาท': 'Pick only areas that differ from the role',
    'ทับค่าของบทบาทเฉพาะเรื่องที่กำหนด': 'Overrides the role only where set', 'เช่น เลขาแผนกดูการลงเวลาทั้งแผนก': 'e.g. a department secretary sees all attendance', 'เลือกบทบาทจากกล่องสีเหลือง': 'Pick a role from the yellow box',
    'กำหนดบทบาทรายคนที่หน้าพนักงาน': 'Assign roles on the employee page', 'บันทึกตารางสิทธิ์': 'Save permission table', 'บันทึกตารางสิทธิ์แล้ว': 'Permission table saved', 'เปิดเมนูตามสิทธิ์': 'Menus follow permissions',
    'ไม่เห็นเมนู': 'Menu hidden', 'ดูตารางใช้ขอบเขต': 'Viewing the schedule uses the scope', 'เซิร์ฟเวอร์ตรวจซ้ำทุกคำสั่ง': 'The server re-checks every command', 'อนุญาต': 'Allow', 'ไม่อนุญาต': 'Deny',
    'Workflow อนุมัติ': 'Approval workflow', 'ขั้นตอนอนุมัติคำขอ': 'Request approval steps', 'การแจ้งเตือน': 'Notifications', 'แจ้งเตือน': 'Notify', 'แจ้งเตือนทาง': 'Notify via', 'แจ้งเตือนผ่าน': 'Notify through',
    'แจ้งหัวหน้าทีม': 'Notify team lead', 'แจ้งผลทาง': 'Send result via', 'ส่งผลอนุมัติและคำขอใหม่ทาง': 'Send approvals and new requests via', 'ใช้ส่งผลอนุมัติและคำขอใหม่ทาง': 'Used to send approvals and new requests via',
    'คำขอใหม่ ถึงพนักงานและหัวหน้าทาง': 'new requests to employees and leads via', 'ระบบส่งข้อความแจ้งผลการอนุมัติ': 'The system sends approval results', 'รับแจ้งเตือนคำขอที่ต้อง': 'Get notified of requests that need',
    'ตอนนี้ระบบบันทึกข้อความแจ้งเตือนไว้ในแท็บ': 'Notifications are currently logged in the tab', 'ยังไม่มีข้อความ': 'No messages yet', 'เตือน': 'Warn', 'การเชื่อมต่อ': 'Connections',
    'การเชื่อมต่อระบบอื่น และความเร็วของระบบ': 'Integrations and system speed', 'ความเร็วระบบ': 'System speed', 'ความเร็วของระบบ': 'System speed', 'เพื่อดูเวลาที่ใช้ต่อคำสั่ง': 'to see time per command',
    'รูปพนักงานในระบบ': 'Employee photos', 'แปลงรูปจาก': 'Converting photos from', 'กำลังแปลงรูปจาก': 'Converting photos from', 'เบื้องหลัง': 'in the background', 'ระบบเดิมยังใช้งานแยก': 'The old system still runs separately',
    'เชื่อมเมื่อทำหน้าตารางงาน': 'Connected when the schedule page is built', 'ยังไม่ได้ตั้งค่า': 'Not configured', 'ยังไม่ตั้ง': 'Not set', 'ให้ผู้ดูแลตั้ง': 'Ask an admin to set',
    'วันหยุด': 'Holidays', 'วันหยุดบริษัท': 'Company holidays', 'วันหยุดนักขัตฤกษ์': 'Public holidays', 'นักขัตฤกษ์': 'Public', 'วันหยุดนักขัตฤกษ์และวันหยุดบริษัท': 'Public and company holidays', 'เพิ่มวันหยุด': 'Add holiday',
    'เพิ่มวันหยุดแล้ว': 'Holiday added', 'แก้ไขวันหยุด': 'Edit holiday', 'แก้ไขวันหยุดแล้ว': 'Holiday updated', 'ลบวันหยุด': 'Delete holiday', 'ลบวันหยุดแล้ว': 'Holiday deleted', 'ชื่อวันหยุด': 'Holiday name',
    'วันหยุดปี': 'Holidays in', 'วันหยุด ปี': 'Holidays in', 'ยังไม่มีวันหยุด': 'No holidays', 'ยังไม่มีวันหยุดของปีนี้': 'No holidays this year', 'คัดลอกจากปีที่แล้ว': 'Copy from last year', 'คัดลอกวันหยุดบริษัทจากปี': 'Copy company holidays from',
    'วันหยุดบริษัทของปี': 'Company holidays of', 'ไม่มีวันหยุดบริษัทของปี': 'No company holidays in', 'ไม่มีวันที่คัดลอกได้': 'Nothing to copy', 'ที่ยังไม่มีในปี': 'not yet in', 'ที่ต้องคัดลอก': 'to copy',
    'อาจซ้ำกับวันหยุดเดิม': 'may duplicate an existing holiday', 'ตามประกาศราชการ': 'per government announcement', 'บริษัทประกาศเอง': 'announced by the company', 'เช่น หยุดพิเศษส่งท้ายปี': 'e.g. year-end special holiday',
    'วันหยุดไม่นับเป็นวันลาและไม่นับขาดงาน': 'Holidays are not leave and not absence', 'ไม่นับวัน': 'not counted', 'ไม่นับขาด': 'not absent',
    'ลบวันที่ผ่านมาแล้ว ระบบคำนวณสรุปลงเวลาของวันนั้นใหม่ให้': 'Deleting a past date recalculates that day’s attendance', 'ถ้าเป็นวันที่ผ่านมาแล้ว ระบบคำนวณสรุปลงเวลาของวันนั้นใหม่ให้': 'For past dates the attendance summary is recalculated',
    'ถ้าวันนี้ผ่านมาแล้ว คนที่ไม่ได้ลงเวลาในวันนั้นจะถูกนับเป็นขาดงาน': 'If the date has passed, people without attendance become absent', 'ลบแล้วกู้คืนไม่ได้': 'Cannot be undone', 'กู้คืนไม่ได้': 'Cannot be undone',
    'แก้ไขหรือลบไม่ได้': 'Cannot edit or delete', 'ไม่มีอะไรเปลี่ยน': 'Nothing changed', 'ไม่มีค่าที่เปลี่ยน': 'No changes', 'รายการที่ยังไม่บันทึก': 'Unsaved items', 'ตอนนี้ การแก้ไขจะหาย': 'now, changes will be lost', 'ถ้าไปหมวด': 'If you go to',
    'ไม่แตะข้อมูลเดิมจนกว่าจะยืนยัน': 'Existing data is untouched until confirmed', 'ช่องที่มี': 'Fields with', 'ใช้ค่าในตาราง': 'Use table values', 'ใช้เลขเดิม': 'Keep number', 'ไม่ระบุวันที่': 'No date',
    // ── Audit ──
    'Audit Log': 'Audit Log', 'ประวัติการเปลี่ยนแปลงข้อมูลทั้งหมด': 'All data change history', 'ทุกการเปลี่ยนแปลงบันทึกใน': 'Every change is logged in',
    // ── วัน / เดือน ──
    'อาทิตย์': 'Sunday', 'จันทร์': 'Monday', 'อังคาร': 'Tuesday', 'พุธ': 'Wednesday', 'พฤหัสบดี': 'Thursday', 'ศุกร์': 'Friday', 'เสาร์': 'Saturday', 'อา': 'Su', 'พฤ': 'Th',
    'มกราคม': 'January', 'กุมภาพันธ์': 'February', 'มีนาคม': 'March', 'เมษายน': 'April', 'พฤษภาคม': 'May', 'มิถุนายน': 'June', 'กรกฎาคม': 'July', 'สิงหาคม': 'August', 'กันยายน': 'September',
    'ตุลาคม': 'October', 'พฤศจิกายน': 'November', 'ธันวาคม': 'December', 'ปีก่อน': 'Previous year', 'ปีถัดไป': 'Next year', 'ของปี': 'of', 'ต่อ': 'per',
    // ── อื่น ๆ ──
    'ไทย': 'Thai', 'อังกฤษ': 'English', 'ภาษา': 'Language', 'ปรับไม่ได้': 'Not adjustable', 'ตัวท้าย': 'last digits', 'ส่วนกลาง': 'Shared', 'ทุกการ': 'every', 'พร้อมแล้ว กดปุ่ม': 'Ready, press',
    'เพิ่มที่ปุ่ม': 'Add with the button', 'เลือกอย่างน้อย': 'Select at least', 'ติ๊ก': 'Tick', 'ไม่ติ๊กเลย': 'tick none', 'งานที่ติ๊ก': 'ticked jobs', 'กรอกหมายเหตุ': 'Enter a note', 'กรอกเมื่อต้องการเปลี่ยน': 'Fill in to change',
    'เลือกข้อความแล้ว กด': 'Select the text, then press', 'หรือเปิดลิงก์ใน': 'or open the link in', 'อื่น หรือแจ้ง': 'other, or tell', 'จะเพิ่มในรอบถัดไปตาม': 'will be added later per',
    'รายงานการลงเวลา การลา': 'Attendance and leave reports', 'สร้าง': 'Create', 'ผ่านแล้ว': 'Past', 'เฉพาะ': 'Only', 'รอ': 'Waiting', 'ไม่แสดง': 'Hidden', 'บริษัท': 'Company', 'คำขอทั้งหมดเดือนนี้': 'All requests this month', 'ของคุณ': 'Yours',
    'หลัก': 'Main', 'เริ่ม': 'Start', 'จัดการ': 'Manage', 'ออกงาน': 'Clock-out', 'เช้า': 'Morning', 'บ่าย': 'Afternoon', 'อยู่ใน': 'In', 'เมื่อมี': 'when there is', 'เมื่อลาเกิน': 'When leave exceeds',
    'ผู้ดูแลระบบแก้ได้': 'Editable by admins', 'เพื่อเรียงลำดับในตาราง': 'to order the table', 'วัน หรือประเภทที่ตั้ง': 'days, or as set per type', 'ไม่มีมาสายเดือนนี้': 'No late arrivals this month',
    'ขอเชื่อม': 'Link request', 'แผนที่': 'Map', 'ห่างจุดลงเวลา': 'Distance from check-in point', 'กม': 'km', 'เปิดแผนที่': 'Open map', 'แก้โดย HR': 'Edited by HR', 'ขอเชื่อมบัญชี': 'Account link request', 'เพิ่มแผนก': 'Add department', 'เพิ่มทีม': 'Add team', 'เพิ่มตำแหน่ง': 'Add position', 'ตั้งกะที่พนักงานเลือกได้': 'Set selectable shifts',
    'แก้ไขข้อมูล': 'Edit info', 'ผู้ดูแลระบบ': 'Administrator',
    // ── ข้อความ error จากเซิร์ฟเวอร์ (app/gas) ──
    'ใน': "in", 'เลข': "number", 'รัน': "run", 'จุด': "point", 'แจ้ง': "notify", 'สีของ': "color of", 'ในแท็บ': "in tab", 'ให้แทน': "instead", 'ปลายทาง': "target", 'แผนกนี้': "this department", 'ไม่พบรถ': "Vehicle not found", 'ไม่พบทีม': "Team not found", 'ตัวอักษร': "characters", 'เลือกแผนก': "Select a department", 'ไม่พบแผนก': "Department not found", 'ไม่พบแท็บ': "Tab not found", 'หลัก เช่น': "digits, e.g.", 'ใส่ชื่องาน': "Enter a job name", 'รูปแบบเวลา': "Time format", 'กรอกชื่อกะ': "Enter a shift name", 'ไม่พบกะนี้': "Shift not found", 'ไม่พบคำขอลา': "Leave request not found", 'ไม่พบข้อมูล': "Data not found", 'กรอกนามสกุล': "Enter a last name", 'ยืนยันตัวตน': "Verification", 'กรอกชื่อแผนก': "Enter a department name", 'ใหม่อีกครั้ง': "again", 'ยังไม่ได้รัน': "has not run", 'ไม่พบอุปกรณ์': "Device not found", 'ไม่ครบทุกวัน': "not every day", 'หากต้องแก้ไข': "If you need changes", 'ใส่ทะเบียนรถ': "Enter a plate number", 'ยังไม่ได้ตั้ง': "Not set", 'ห้ามใช้อักขระ': "Not allowed characters:", 'ใส่เป็นตัวเลข': "Enter a number", 'มีชื่อนี้แล้ว': "This name already exists", 'รัศมีอย่างน้อย': "Radius at least", 'ใส่คนได้สูงสุด': "Maximum people:", 'ไม่รู้จักตาราง': "Unknown table", 'เวลาไม่ถูกต้อง': "Invalid time", 'ไม่รู้จักคำสั่ง': "Unknown command", 'กำลังคัดลอกอยู่': "Copy in progress", 'นาทีแล้วลองใหม่': "minutes and try again", 'ตำแหน่งมากเกินไป': "Too many positions", 'กรุณากรอกชื่องาน': "Please enter a job name", 'วันที่ไม่ถูกต้อง': "Invalid date", 'เลือกวันเริ่มงาน': "Select a start date", 'จัดการรถได้เฉพาะ': "Vehicles can only be managed by", 'แอปไม่ตรงกับระบบ': "app does not match the system", 'หลัก ขึ้นต้นด้วย': "digits starting with", 'ไม่พบวันหยุดเดิม': "Holiday not found", 'เลือกวันที่เริ่ม': "Select a start date", 'ยังไม่ได้ติดตั้ง': "Not installed", 'ข้อมูลไม่ถูกต้อง': "Invalid data", 'รหัสผ่านอย่างน้อย': "Password at least", 'ไฟล์รูปไม่ถูกต้อง': "Invalid image file", 'ไม่พบรายการลงเวลา': "Attendance entry not found", 'ละติจูดไม่ถูกต้อง': "Invalid latitude", 'ไม่มีสิทธิ์ดูเมนู': "No permission for menu", 'ไฟล์โลโก้ต้องเป็น': "Logo file must be", 'ลองจิจูดไม่ถูกต้อง': "Invalid longitude", 'ยังไม่รองรับคำสั่ง': "Command not supported yet", 'ไม่พบข้อมูลพนักงาน': "Employee record not found", 'พนักงานคนนี้เชื่อม': "This employee is linked to", 'รหัสผ่านไม่ถูกต้อง': "Wrong password", 'กรอกเวลาเข้าและออก': "Enter clock-in and clock-out", 'รหัสนี้มีคนใช้แล้ว': "This code is already used", 'ข้อมูลสีไม่ถูกต้อง': "Invalid color data", 'เลขบัญชีเป็นตัวเลข': "Account number must be digits", 'ไม่มีสิทธิ์ลบงานนี้': "You cannot delete this job", 'เวลาเลยเวลาปัจจุบัน': "Time is in the future", 'ค่าขอบเขตไม่ถูกต้อง': "Invalid scope value", 'จ้างรายวันได้สูงสุด': "Maximum daily hires:", 'ทีมไม่อยู่ในแผนกนี้': "The team is not in this department", 'กรอกชื่อประเภทการลา': "Enter a leave type name", 'ระบุเหตุผลการยกเลิก': "Give a cancellation reason", 'ยกเลิกคำขอนี้ไม่ได้': "This request cannot be cancelled", 'ข้อมูลทีมไม่ถูกต้อง': "Invalid team data", 'คุณไม่มีสิทธิ์สร้าง': "You cannot create", 'ระบบตั้งค่าแล้ว ให้': "Already set up; ask", 'เลือกประเภทการลงเวลา': "Select a check-in type", 'ไม่มีสิทธิ์แก้งานนี้': "You cannot edit this job", 'ระบุเหตุผลการแก้เวลา': "Give a reason for the time edit", 'ยังไม่ได้ตั้งค่าระบบ': "The system is not set up", 'ไม่มีสิทธิ์ดูคำขอนี้': "You cannot view this request", 'รหัสพนักงานเป็นตัวเลข': "Employee code must be digits", 'รูปแบบอีเมลไม่ถูกต้อง': "Invalid email format", 'แก้เวลาล่วงหน้าไม่ได้': "Cannot edit future times", 'งานหนึ่งยาวได้ไม่เกิน': "A job can last at most", 'ไม่รู้จักประเภทข้อมูล': "Unknown data type", 'ค่าจ้างต้องเป็นตัวเลข': "Wage must be a number", 'ชื่อตำแหน่งไม่ถูกต้อง': "Invalid position name", 'ผู้ดูแลระบบไม่มีการลา': "Administrators have no leave", 'ไม่มีสิทธิ์ดูตารางงาน': "You cannot view the schedule", 'ระบุเหตุผลที่ขอยกเลิก': "Give a reason for cancelling", 'รายการไม่ตรงกับพนักงาน': "Entry does not match the employee", 'แก้ไขคำขอนี้ไม่ได้แล้ว': "This request can no longer be edited", 'จำนวนวันต้องเป็นตัวเลข': "Days must be a number", 'เลือกวันทำงานอย่างน้อย': "Select at least one workday", 'คำขอนี้ถูกจัดการไปแล้ว': "This request was already handled", 'เลือกเข้างานหรือออกงาน': "Choose clock-in or clock-out", 'เวลาออกต้องหลังเวลาเข้า': "Clock-out must be after clock-in", 'เลือกจุดลงเวลาอย่างน้อย': "Select at least one check-in point", 'นี้ยังไม่ได้ยืนยันอีเมล': "has not verified its email", 'ไม่มีสิทธิ์จัดงานให้ทีม': "You cannot schedule this team", 'ใช้ตัวอักษรอังกฤษ ตัวเลข': "Use English letters, digits", 'แก้ไขงานในแผนกหรือทีมนี้': "or edit jobs in this department or team", 'เพิ่มพนักงานใหม่ได้เฉพาะ': "Only these can add employees:", 'รายการนี้ถูกยกเลิกไปแล้ว': "This entry was already voided", 'กรอกผิดหลายครั้ง กรุณารอ': "Too many attempts, please wait", 'แก้สถานะโปรเจกต์ได้เฉพาะ': "Project status can only be changed by", 'ประเภทการลงเวลาไม่ถูกต้อง': "Invalid check-in type", 'คุณไม่มีสิทธิ์แก้ไขงานนี้': "You cannot edit this job", 'ใส่จำนวนชั่วโมงเป็นตัวเลข': "Enter hours as a number", 'ผู้ดูแลระบบไม่มีการลงเวลา': "Administrators have no attendance", 'เลือกวันที่อนุมัติบางส่วน': "Select the days to approve", 'ไม่สำเร็จ กรุณาเปิดแอปจาก': "failed; please reopen the app from", 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้': "You cannot edit this data", 'คำขอนี้ไม่ได้รอคุณพิจารณา': "This request is not waiting for you", 'ไม่พบงานนี้ อาจถูกลบไปแล้ว': "Job not found; it may have been deleted", 'พนักงานคนนี้ยังไม่ได้เชื่อม': "This employee is not linked", 'ใส่รหัสผิดหลายครั้ง กรุณารอ': "Too many wrong passwords, please wait", 'กรอกเหตุผลการยกเลิกการเชื่อม': "Enter a reason for unlinking", 'ยังไม่ได้ตั้งรหัสผ่านผู้ดูแล': "Admin password not set", 'ไม่พบรายการนี้ อาจถูกลบไปแล้ว': "Item not found; it may have been deleted", 'เวลาออกต้องไม่เท่ากับเวลาเข้า': "Clock-out must differ from clock-in", 'แล้ว ถ้าเปลี่ยนบัญชีให้ติดต่อ': "already; to change accounts contact", 'รูปใหญ่เกินไป ลองเลือกรูปใหม่': "Image too large, choose another", 'ผู้ดูแลระบบไม่มีข้อมูลพนักงาน': "Administrators have no employee record", 'ไม่พบพนักงาน หรือไม่มีสิทธิ์ดู': "Employee not found or no permission", 'มีพนักงานที่ไม่พบหรือลาออกแล้ว': "Some employees were not found or have resigned", 'บทบาทนี้ไม่มีสิทธิ์ทำรายการนี้': "Your role cannot do this", 'เวลาเลิกงานต้องหลังเวลาเข้างาน': "End time must be after start time", 'ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง': "Failed, please try again", 'โลโก้ใหญ่เกินไป ลองไฟล์ที่เล็กลง': "Logo too large, try a smaller file", 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น': "End date cannot be before start date", 'วันที่สิ้นสุดต้องไม่ก่อนวันเริ่ม': "End date cannot be before start date", 'รูปหน้างานยังไม่เปิดใช้ในระบบใหม่': "Site photos are not enabled in the new system", 'ไม่มีสิทธิ์แก้ไขข้อมูลพนักงานคนนี้': "You cannot edit this employee", 'กรุณาเปิดตำแหน่งที่ตั้งแล้วลองใหม่': "Please turn on location and try again", 'วันลาผ่านไปแล้วทั้งหมด ยกเลิกไม่ได้': "All leave days have passed; cannot cancel", 'ระบุเหตุผลเมื่อไม่อนุมัติหรือส่งกลับ': "Give a reason when rejecting or returning", 'นี้เชื่อมกับพนักงานคนอื่นแล้ว ติดต่อ': "is already linked to another employee; contact", 'ลิงก์นี้หมดอายุหรือถูกใช้แล้ว ขอลิงก์ใหม่จาก': "This link expired or was used; ask for a new one from", 'อีเมลนี้ซ้ำกันในข้อมูลพนักงานหลายคน กรุณาติดต่อ': "This email belongs to several employees; please contact", 'ระบบกำลังบันทึกข้อมูลของคนอื่น กรุณาลองใหม่อีกครั้ง': "Someone else is saving, please try again", 'ระบบย้ายไปเซิร์ฟเวอร์ใหม่แล้ว กรุณาปิดแอปแล้วเปิดใหม่': "The system moved to a new server; please reopen the app", 'กรอกชื่อ': "Enter a name", 'กรอกรหัส': "Enter a code", 'บันทึกไม่สำเร็จ': "Save failed", 'เฉพาะ HR': "HR only", 'กรุณาลองใหม่': "please try again", 'กรุณา': "please", 'ไม่ถูกต้อง': "invalid", 'ชั่วคราว': "temporarily", 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่': "Temporary system error, please try again", 'คำขอไม่ถูกต้อง': "Invalid request", 'ไม่มีสิทธิ์': "No permission", 'คุณไม่มีสิทธิ์สร้าง/แก้ไขงานในแผนกหรือทีมนี้': "You cannot create or edit jobs in this department or team", 'และส่งออก': 'and export', 'และเทียบกับเวลาลงเวลาจริง': 'and compare with actual attendance', 'ใหม่': 'New', 'บัญชีของ': 'account of'
  };
  // ชื่อคน/ชื่อเล่นที่บังเอิญอยู่ในรายการข้อความ (ปุ่มโหมดทดสอบ) → ไม่แปล
  ['ต้น', 'บอย', 'โอ๊ต', 'มิ้นท์', 'มิ้นต์'].forEach(function (k) { delete D[k]; });
  var TM = { 'ม.ค.': 'Jan', 'ก.พ.': 'Feb', 'มี.ค.': 'Mar', 'เม.ย.': 'Apr', 'พ.ค.': 'May', 'มิ.ย.': 'Jun', 'ก.ค.': 'Jul', 'ส.ค.': 'Aug', 'ก.ย.': 'Sep', 'ต.ค.': 'Oct', 'พ.ย.': 'Nov', 'ธ.ค.': 'Dec' };
  var TD = { 'อา.': 'Sun', 'จ.': 'Mon', 'อ.': 'Tue', 'พ.': 'Wed', 'พฤ.': 'Thu', 'ศ.': 'Fri', 'ส.': 'Sat' };
  var MRE = /(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)(\s*)(25\d\d)?/g;
  var FULLM = /(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+(25\d\d)/g;
  if (window.WTM_DICT) for (var _k in window.WTM_DICT) D[_k] = window.WTM_DICT[_k];   // คำเฉพาะ WTM ทับ/เพิ่ม
  var RUN = /[฀-๿](?:[฀-๿ ]*[฀-๿])?/g, TH = /[฀-๿]/;
  var word = function (w) { return D.hasOwnProperty(w) ? D[w] : null; };
  function tr(s) {
    if (!TH.test(s)) return s;
    var whole = s.trim(); if (D.hasOwnProperty(whole)) return s.replace(whole, D[whole]);   // ข้อความเต็มที่มีเครื่องหมาย (เช่น สร้าง/แก้ไข) ตรงพจนานุกรมทั้งก้อน
    s = s.replace(MRE, function (m, mo, sp, y) { return TM[mo] + (y ? sp + (Number(y) - 543) : sp); })
      .replace(FULLM, function (m, mo, y) { return D[mo] + ' ' + (Number(y) - 543); })
      .replace(/(^|[\s(–,·-])(อา\.|จ\.|อ\.|พฤ\.|พ\.|ศ\.|ส\.)(?=$|[\s\d–,·)-])/g, function (m, a, d) { return a + TD[d]; })
      .replace(/(พ\.ศ\.|ปี)\s*(25\d\d)/g, function (m, p, y) { return (p === 'ปี' ? 'Year ' : '') + (Number(y) - 543); })
      .replace(/^สวัสดี คุณ(.+)$/, 'Hello, $1').replace(/ชื่อ ก–ฮ/g, 'Name A–Z').replace(/Workflow อนุมัติ/g, 'Approval workflow').replace(/(\d)\s*กม\./g, '$1 km').replace(/(\d)\s*ม\.(?=$|[\s·)])/g, '$1 m')
      .replace(/(\d{1,2}[:.]\d{2})\s*น\./g, '$1').replace(/^(อา\.|จ\.|อ\.|พ\.|พฤ\.|ศ\.|ส\.)$/, function (d) { return TD[d]; });
    return s.replace(RUN, function (r) {
      var x = word(r); if (x !== null) return x;
      var ws = r.split(' '), out = [];   // ทุกคำในช่วงต้องรู้จัก ไม่งั้นคงไว้ทั้งช่วง (กันแปลชื่อคน/ข้อความที่ผู้ใช้กรอก)
      for (var i = 0; i < ws.length; i++) { var y = word(ws[i]); if (y === null) return r; out.push(y); }
      return out.join(' ');
    });
  }
  var LANG = 'th'; try { LANG = localStorage.getItem('hr_lang') === 'en' ? 'en' : 'th'; } catch (e) {}
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE|IFRAME|SVG)$/, ATTR = ['placeholder', 'title', 'aria-label'];
  var touched = [];   // โหนดที่แปลแล้ว (เก็บข้อความเดิม) → กลับเป็นไทย
  function skip(el) { for (var n = el; n && n.nodeType === 1; n = n.parentNode) { if (SKIP.test(n.tagName) || n.isContentEditable || n.hasAttribute('data-noi18n')) return true; } return false; }
  function doText(t) { var v = t.nodeValue; if (!v || !TH.test(v) || skip(t.parentNode)) return; var n = tr(v); if (n !== v) { if (t.__th == null) { t.__th = v; touched.push(t); if (touched.length > 6000) touched = touched.filter(function (x) { return x.isConnected; }); } t.nodeValue = n; } }
  function skipA(el) { for (var n = el; n && n.nodeType === 1; n = n.parentNode) { if (/^(SCRIPT|STYLE|IFRAME)$/.test(n.tagName) || n.isContentEditable || n.hasAttribute('data-noi18n')) return true; } return false; }
  function doEl(el) { if (skipA(el)) return; ATTR.forEach(function (a) { var v = el.getAttribute(a); if (v && TH.test(v)) { var n = tr(v); if (n !== v) { (el.__tha = el.__tha || {})[a] = el.__tha[a] || v; if (touched.indexOf(el) < 0) touched.push(el); el.setAttribute(a, n); } } }); }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root); root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(doEl);
    if (skip(root)) return;
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), t; while ((t = it.nextNode())) doText(t);
  }
  var mo = new MutationObserver(function (ms) { if (LANG !== 'en') return; ms.forEach(function (m) {
    if (m.type === 'characterData') doText(m.target); else if (m.type === 'attributes') doEl(m.target); else m.addedNodes.forEach(walk); }); });
  function restore() { touched.forEach(function (n) { if (n.nodeType === 3) { if (n.__th != null) { n.nodeValue = n.__th; n.__th = null; } } else if (n.__tha) { Object.keys(n.__tha).forEach(function (a) { n.setAttribute(a, n.__tha[a]); }); n.__tha = null; } }); touched = []; }
  function apply() {
    document.documentElement.lang = LANG; document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === LANG)); });
    if (LANG === 'en') { walk(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR }); }
    else { mo.disconnect(); restore(); }
  }
  window.hrLang = function () { return LANG; };
  window.hrT = tr;
  window.setLang = function (l) { LANG = l === 'en' ? 'en' : 'th'; try { localStorage.setItem('hr_lang', LANG); } catch (e) {} apply(); };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-lang]'); if (b) { e.preventDefault(); window.setLang(b.getAttribute('data-lang')); } });
  // ปุ่มที่เพิ่งวาดใหม่ (หน้า render ใหม่) ต้องแสดงสถานะภาษาปัจจุบัน
  new MutationObserver(function () { document.querySelectorAll('[data-lang]').forEach(function (b) { var on = String(b.getAttribute('data-lang') === LANG); if (b.getAttribute('aria-pressed') !== on) b.setAttribute('aria-pressed', on); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
