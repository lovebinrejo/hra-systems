from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='sessions',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
