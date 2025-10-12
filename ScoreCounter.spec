# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[('*.html', '.'), ('*.js', '.'), ('*.css', '.')],
    # Added firebase / google cloud related hidden imports so Firestore works in packaged app
    hiddenimports=[
        'PIL._tkinter', 'PIL._imagingtk', 'PIL._tkinter_finder',
        'google.cloud', 'google.cloud.firestore', 'google.api_core',
        'google.api_core.path_template', 'google.rpc', 'grpc', 'grpc._cython.cygrpc'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ScoreCounter',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
