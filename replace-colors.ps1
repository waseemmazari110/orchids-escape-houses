$file = 'D:\orchids-escape-houses-1\src\app\owner-dashboard\page.tsx'
$content = Get-Content $file -Raw

# Replace purple with sage theme colors
$content = $content -replace 'bg-purple-600', 'bg-\[#89A38F\]'
$content = $content -replace 'bg-purple-700', 'bg-\[#7a9080\]'
$content = $content -replace 'text-purple-600', 'text-\[#89A38F\]'
$content = $content -replace 'hover:bg-purple-700', 'hover:bg-\[#7a9080\]'
$content = $content -replace 'active:bg-purple-700', 'active:bg-\[#7a9080\]'

# Purple light colors
$content = $content -replace 'bg-purple-100', 'bg-\[#E3EBE7\]'
$content = $content -replace 'text-purple-100', 'text-\[#E3EBE7\]'
$content = $content -replace 'hover:bg-purple-200', 'hover:bg-\[#D0DED5\]'
$content = $content -replace 'bg-purple-200', 'bg-\[#D0DED5\]'
$content = $content -replace 'active:bg-purple-200', 'active:bg-\[#D0DED5\]'
$content = $content -replace 'hover:bg-purple-300', 'hover:bg-\[#BDD1C3\]'
$content = $content -replace 'ring-purple-300', 'ring-\[#BDD1C3\]'
$content = $content -replace 'hover:bg-purple-50', 'hover:bg-\[#F5F3F0\]'

# Indigo to sage/gold
$content = $content -replace 'text-indigo-600', 'text-\[#89A38F\]'
$content = $content -replace 'border-t-indigo-600', 'border-t-\[#89A38F\]'
$content = $content -replace 'bg-indigo-100', 'bg-\[#E3EBE7\]'
$content = $content -replace 'text-indigo-100', 'text-\[#E3EBE7\]'

# Emerald (approved) to sage
$content = $content -replace 'bg-emerald-50', 'bg-\[#F5F3F0\]'
$content = $content -replace 'border-emerald-200', 'border-\[#D0DED5\]'
$content = $content -replace 'text-emerald', 'text-\[#89A38F\]'
$content = $content -replace 'bg-emerald', 'bg-\[#89A38F\]'

# Blue to sage
$content = $content -replace 'bg-blue-50', 'bg-\[#F5F3F0\]'
$content = $content -replace 'border-blue-200', 'border-\[#D0DED5\]'

Set-Content $file $content
Write-Host 'Color replacement complete!'
