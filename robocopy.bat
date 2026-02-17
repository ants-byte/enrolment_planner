@echo off

set "SOURCE=C:\_me\workspaces\site"
set "DEST=C:\Users\addve\OneDrive - Melbourne Polytechnic\General - Bachelor of Information Technology Operations\Enrol 26_S1\Enrolment System\site"

robocopy "%SOURCE%" "%DEST%" /MIR /COPY:DAT /DCOPY:DAT /R:2 /W:5 /FFT /Z /XA:H /XJ /NP

echo.
echo Mirror complete (no admin required).
pause
