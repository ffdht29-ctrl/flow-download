document.getElementById('message').textContent=new URLSearchParams(location.search).get('message')||'无法连接当前页面';
