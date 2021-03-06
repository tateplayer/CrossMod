﻿using OpenTK.Graphics.OpenGL;
using SFGraphics.GLObjects.Textures;
using System.Collections.Generic;
using System.Drawing;

namespace CrossMod.Rendering.Resources
{
    public class DefaultTextures
    {
        // Default textures.
        public Texture2D defaultWhite = new Texture2D();
        public Texture2D defaultNormal = new Texture2D();
        public Texture2D defaultBlack = new Texture2D();
        public Texture2D defaultPrm = new Texture2D();

        // Render modes.
        public Texture2D uvPattern = new Texture2D()
        {
            TextureWrapS = TextureWrapMode.Repeat,
            TextureWrapT = TextureWrapMode.Repeat
        };

        // PBR image based lighting.
        public Texture2D iblLut = new Texture2D();
        public TextureCubeMap diffusePbr = new TextureCubeMap();
        public TextureCubeMap specularPbr = new TextureCubeMap();
        public TextureCubeMap blackCube = new TextureCubeMap();

        public DefaultTextures()
        {
            LoadBitmap(uvPattern, "DefaultTextures/UVPattern.png");

            LoadBitmap(defaultWhite, "DefaultTextures/default_White.png");
            LoadBitmap(defaultPrm, "DefaultTextures/default_Params.tif");
            LoadBitmap(defaultNormal, "DefaultTextures/default_normal.png");
            LoadBitmap(defaultBlack, "DefaultTextures/default_black.png");

            LoadBitmap(iblLut, "DefaultTextures/ibl_brdf_lut.png");

            using (var bmp = new Bitmap("DefaultTextures/default_cube_black.png"))
                blackCube.LoadImageData(bmp, 8);

            LoadDiffusePbr();
            LoadSpecularPbr();
        }

        private void LoadBitmap(Texture2D texture, string path)
        {
            using (var bmp = new Bitmap(path))
            {
                texture.LoadImageData(bmp);
            }
        }

        private void LoadDiffusePbr()
        {
            diffusePbr = new TextureCubeMap();

            var surfaceData = new List<List<byte[]>>();
            for (int surface = 0; surface < 6; surface++)
            {
                var mipData = System.IO.File.ReadAllBytes($"DefaultTextures/diffuseSdr{surface}{0}.bin");
                surfaceData.Add(new List<byte[]>() { mipData });
            }
            diffusePbr.LoadImageData(128, InternalFormat.CompressedRgbaS3tcDxt1Ext, surfaceData[0], surfaceData[1], surfaceData[2], surfaceData[3], surfaceData[4], surfaceData[5]);

            // Don't Use mipmaps.
            diffusePbr.MagFilter = TextureMagFilter.Linear;
            diffusePbr.MinFilter = TextureMinFilter.Linear;
        }

        private void LoadSpecularPbr()
        {
            specularPbr = new TextureCubeMap();
            var surfaceData = new List<List<byte[]>>();
            for (int surface = 0; surface < 6; surface++)
            {
                var mipmaps = new List<byte[]>();
                for (int mip = 0; mip < 10; mip++)
                {
                    var mipData = System.IO.File.ReadAllBytes($"DefaultTextures/specularSdr{surface}{mip}.bin");
                    mipmaps.Add(mipData);
                }
                surfaceData.Add(mipmaps);
            }
            specularPbr.LoadImageData(512, InternalFormat.CompressedRgbaS3tcDxt1Ext, surfaceData[0], surfaceData[1], surfaceData[2], surfaceData[3], surfaceData[4], surfaceData[5]);
        }
    }
}
