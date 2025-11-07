import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET single slide
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Добавляем retry логику для обработки временных проблем с подключением к БД
    let retries = 3;
    let lastError: any = null;
    
    while (retries > 0) {
      try {
        const slide = await prisma.slide.findUnique({
          where: { id: params.id },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            products: {
              include: {
                product: true
              }
            },
            // @ts-ignore - Prisma types
            SlideConfidentiality: {
              include: {
                Confidentiality: true
              }
            },
            components: {
              include: {
                component: true
              }
            },
            integrations: {
              include: {
                integration: true
              }
            },
            // @ts-ignore - Prisma types not updated
            solutionAreas: {
              include: {
                solutionArea: true
              }
            },
            // @ts-ignore - Prisma types
            SlideCategory: {
              include: {
                Category: true
              }
            }
          }
        });

        if (!slide) {
          return NextResponse.json(
            { error: 'Slide not found' },
            { status: 404 }
          );
        }

        return NextResponse.json(slide);
      } catch (error: any) {
        lastError = error;
        // Проверяем, является ли это ошибкой подключения к БД
        if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
          retries--;
          if (retries > 0) {
            // Ждем перед повторной попыткой (экспоненциальная задержка)
            const delay = Math.pow(2, 3 - retries) * 100; // 100ms, 200ms, 400ms
            console.warn(`Database connection error, retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        // Если это не ошибка подключения или закончились попытки, выбрасываем ошибку
        throw error;
      }
    }
    
    // Если дошли сюда, значит все попытки исчерпаны
    throw lastError;
  } catch (error: any) {
    console.error('Error fetching slide:', error);
    
    // Более детальная обработка ошибок
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.',
          details: error.message
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch slide',
        message: error.message || 'Произошла ошибка при загрузке слайда'
      },
      { status: 500 }
    );
  }
}

// UPDATE slide (PATCH - селективное обновление)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('📥 Received update request:', body);
    
    const { 
      title, 
      description, 
      category, 
      imageUrl,
      status,
      format,
      language,
      region,
      domain,
      authorName,
      department,
      isCaseStudy,
      yearStart,
      yearFinish,
      productCodes,
      confidentialityCodes,
      componentCodes,
      integrationCodes,
      solutionAreaCodes,
      categoryIds,
      isActive
    } = body;

    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Добавляем только те поля, которые были переданы (включая null для очистки)
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status !== undefined) updateData.status = status === 'none' || status === '' || status === null ? null : status;
    if (format !== undefined) updateData.format = format === 'none' || format === '' || format === null ? null : format;
    if (language !== undefined) updateData.language = language === 'none' || language === '' || language === null ? null : language;
    if (region !== undefined) updateData.region = region === 'none' || region === '' || region === null ? null : region;
    if (domain !== undefined) updateData.domain = domain === 'none' || domain === '' || domain === null ? null : domain;
    if (authorName !== undefined) updateData.authorName = authorName === 'none' || authorName === '' || authorName === null ? null : authorName;
    if (department !== undefined) updateData.department = department === 'none' || department === '' || department === null ? null : department;
    if (isCaseStudy !== undefined) updateData.isCaseStudy = isCaseStudy;
    if (yearStart !== undefined) updateData.yearStart = yearStart === 'none' || yearStart === '' || yearStart === null || yearStart === 0 ? null : yearStart;
    if (yearFinish !== undefined) updateData.yearFinish = yearFinish === 'none' || yearFinish === '' || yearFinish === null || yearFinish === 0 ? null : yearFinish;
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log('📝 Update data prepared:', updateData);
    console.log('📝 Category IDs:', categoryIds);
    console.log('📝 Confidentiality codes:', confidentialityCodes);
    
    // Начинаем транзакцию для обновления слайда и связанных данных
    const updatedSlide = await prisma.$transaction(async (tx) => {
      // Обновляем основные поля слайда
      const slide = await tx.slide.update({
        where: { id: params.id },
        data: updateData
      });

      // Обновляем связанные продукты
      if (productCodes !== undefined) {
        // Удаляем существующие связи
        await tx.slideProduct.deleteMany({
          where: { slideId: params.id }
        });

        // Создаем новые связи
        if (productCodes.length > 0) {
          // Сначала убеждаемся, что все продукты существуют
          const products = await Promise.all(
            productCodes.map(async (code: string) => {
              return await tx.product.upsert({
                where: { code },
                update: {},
                create: { 
                  code, 
                  name: code.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                }
              });
            })
          );

          // Создаем связи
          await tx.slideProduct.createMany({
            data: products.map(product => ({
              slideId: params.id,
              productId: product.id
            }))
          });
        }
      }

      // Обновляем связанные уровни конфиденциальности
      if (confidentialityCodes !== undefined) {
        // @ts-ignore - Prisma types
        await tx.slideConfidentiality.deleteMany({
          where: { slideId: params.id }
        });

        if (confidentialityCodes.length > 0) {
          const confidentialityItems = await Promise.all(
            confidentialityCodes.map(async (code: string) => {
              // @ts-ignore - Prisma types
              return await tx.confidentiality.upsert({
                where: { code },
                update: {},
                create: { 
                  code, 
                  name: code.charAt(0).toUpperCase() + code.slice(1)
                }
              });
            })
          );

          // @ts-ignore - Prisma types
          await tx.slideConfidentiality.createMany({
            data: confidentialityItems.map(item => ({
              slideId: params.id,
              confidentialityId: item.id
            }))
          });
        }
      }

      // Обновляем связанные компоненты
      if (componentCodes !== undefined) {
        await tx.slideComponent.deleteMany({
          where: { slideId: params.id }
        });

        if (componentCodes.length > 0) {
          const components = await Promise.all(
            componentCodes.map(async (code: string) => {
              return await tx.component.upsert({
                where: { code },
                update: {},
                create: { 
                  code, 
                  name: code.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              });
            })
          );

          await tx.slideComponent.createMany({
            data: components.map(component => ({
              slideId: params.id,
              componentId: component.id
            }))
          });
        }
      }

      // Обновляем связанные интеграции
      if (integrationCodes !== undefined) {
        await tx.slideIntegration.deleteMany({
          where: { slideId: params.id }
        });

        if (integrationCodes.length > 0) {
          const integrations = await Promise.all(
            integrationCodes.map(async (code: string) => {
              return await tx.integration.upsert({
                where: { code },
                update: {},
                create: { 
                  code, 
                  name: code.charAt(0).toUpperCase() + code.slice(1)
                }
              });
            })
          );

          await tx.slideIntegration.createMany({
            data: integrations.map(integration => ({
              slideId: params.id,
              integrationId: integration.id
            }))
          });
        }
      }

      // Обновляем связанные solution areas
      if (solutionAreaCodes !== undefined) {
        // @ts-ignore - Prisma types not updated
        await tx.slideSolutionArea.deleteMany({
          where: { slideId: params.id }
        });

        if (solutionAreaCodes.length > 0) {
          const solutionAreas = await Promise.all(
            solutionAreaCodes.map(async (code: string) => {
              // @ts-ignore - Prisma types not updated
              return await tx.solutionArea.findUnique({
                where: { code }
              });
            })
          );

          const validSolutionAreas = solutionAreas.filter(sa => sa !== null);

          if (validSolutionAreas.length > 0) {
            // @ts-ignore - Prisma types not updated
            await tx.slideSolutionArea.createMany({
              data: validSolutionAreas.map(solutionArea => ({
                slideId: params.id,
                solutionAreaId: solutionArea!.id
              }))
            });
          }
        }
      }

      // Update related categories (many-to-many)
      if (categoryIds !== undefined) {
        // @ts-ignore - Prisma types
        await tx.slideCategory.deleteMany({ where: { slideId: params.id } });
        if (categoryIds.length > 0) {
          // @ts-ignore - Prisma types
          await tx.slideCategory.createMany({
            data: categoryIds.map((categoryId: string) => ({
              slideId: params.id,
              categoryId
            }))
          });
        }
      }

      // Возвращаем обновленный слайд со всеми связями
      return await tx.slide.findUnique({
        where: { id: params.id },
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          products: {
            include: {
              product: true
            }
          },
          // @ts-ignore - Prisma types
          SlideConfidentiality: {
            include: {
              Confidentiality: true
            }
          },
          components: {
            include: {
              component: true
            }
          },
          integrations: {
            include: {
              integration: true
            }
          },
          // @ts-ignore - Prisma types not updated
          solutionAreas: {
            include: {
              solutionArea: true
            }
          },
          // @ts-ignore - Prisma types
          SlideCategory: {
            include: {
              Category: true
            }
          }
        }
      });
    });

    return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error('Error updating slide:', error);
    return NextResponse.json(
      { error: 'Failed to update slide' },
      { status: 500 }
    );
  }
}

// DELETE slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all related entries in a transaction
    await prisma.$transaction(async (tx) => {
      // @ts-ignore - Prisma types
      await tx.slideCategory.deleteMany({
        where: { slideId: params.id }
      });
      
      await tx.slideTag.deleteMany({
        where: { slideId: params.id }
      });
      
      await tx.slideProduct.deleteMany({
        where: { slideId: params.id }
      });
      
      // @ts-ignore - Prisma types
      await tx.slideConfidentiality.deleteMany({
        where: { slideId: params.id }
      });
      
      await tx.slideComponent.deleteMany({
        where: { slideId: params.id }
      });
      
      await tx.slideIntegration.deleteMany({
        where: { slideId: params.id }
      });
      
      // @ts-ignore - Prisma types not updated
      await tx.slideSolutionArea.deleteMany({
        where: { slideId: params.id }
      });

      await tx.slide.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting slide:', error);
    return NextResponse.json(
      { error: 'Failed to delete slide' },
      { status: 500 }
    );
  }
} 