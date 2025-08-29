// 测试API调用
const testData = {
  name: "测试用户",
  birthDate: "1990-01-01T10:30:00.000Z",
  birthTime: "10:30",
  gender: "男",
  birthPlace: null,
  isLunar: false
};

fetch('http://192.168.1.56:8787/api/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
  try {
    const json = JSON.parse(data);
    console.log('Parsed JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Failed to parse JSON:', e.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});